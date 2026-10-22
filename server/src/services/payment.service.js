const { getStripe } = require('../config/stripe');
const orderRepository = require('../repositories/order.repository');
const componentRepository = require('../repositories/component.repository');
const ApiError = require('../utils/ApiError');

// Service Paiement : crée un PaymentIntent Stripe (mode test) pour une commande,
// puis confirme le paiement et fait passer la commande en 'paid'.
//
// SÉCURITÉ : le montant facturé est TOUJOURS recalculé depuis la commande en
// base (order.totalAmount), jamais reçu du client. La confirmation interroge
// Stripe (source de vérité) avant de marquer la commande payée.

const CURRENCY = 'eur';

// Stripe raisonne en plus petite unité monétaire (centimes pour l'euro).
function toStripeAmount(amount) {
  return Math.round(amount * 100);
}

// Charge la commande et vérifie que l'utilisateur en est bien le propriétaire.
async function loadOwnedOrder(user, orderId) {
  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Commande introuvable');
  }
  const ownerId = order.user && order.user._id ? order.user._id : order.user;
  if (String(ownerId) !== String(user.id)) {
    throw new ApiError(403, 'Accès refusé : cette commande ne vous appartient pas');
  }
  return order;
}

// Finalise une commande PAYÉE : décrémente le stock de chaque item (atomique et
// borné à 0), puis passe la commande en 'paid' avec stockReserved=true (donc
// annulable avec réincrément). Partagé par le paiement carte (Stripe) ET le
// paiement e-Dinar simulé : la SOURCE du paiement diffère, l'effet en base est
// identique. `extra` permet de joindre des champs spécifiques (ex. paymentIntentId).
async function finalizePaidOrder(order, extra = {}) {
  for (const item of order.items) {
    const componentId = item.component && item.component._id ? item.component._id : item.component;
    const updated = await componentRepository.decrementStock(componentId, item.quantity);
    if (!updated) {
      // Le stock a changé depuis la création (rare). Le paiement est déjà
      // acté : on n'annule pas, on signale juste côté logs.
      console.warn(`⚠️ Stock insuffisant au moment du paiement pour ${item.name} (commande ${order._id}).`);
    }
  }

  return orderRepository.updateById(order._id, {
    status: 'paid',
    stockReserved: true,
    ...extra
  });
}

const paymentService = {
  // Crée (ou réutilise) un PaymentIntent pour la commande et renvoie le clientSecret.
  async createIntent(user, { orderId }) {
    const stripe = getStripe();
    const order = await loadOwnedOrder(user, orderId);

    if (order.status === 'paid') {
      throw new ApiError(400, 'Cette commande est déjà payée');
    }

    // Une commande à la livraison ne se paie pas par carte.
    if (order.paymentMethod === 'cod') {
      throw new ApiError(400, 'Cette commande est en paiement à la livraison (aucun paiement carte)');
    }

    const amount = toStripeAmount(order.totalAmount);

    // Réutilise l'intent existant s'il est encore exploitable (évite les doublons).
    if (order.paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      if (existing && existing.status !== 'canceled' && existing.status !== 'succeeded') {
        return { clientSecret: existing.client_secret, paymentIntentId: existing.id, amount: order.totalAmount, currency: CURRENCY };
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: CURRENCY,
      metadata: { orderId: String(order._id), userId: String(user.id) },
      // Confirmable côté serveur en test, sans redirection (carte de test).
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
    });

    await orderRepository.updateById(order._id, { paymentIntentId: intent.id });

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id, amount: order.totalAmount, currency: CURRENCY };
  },

  // Confirme le paiement : interroge Stripe, et si le paiement a réussi, passe la
  // commande en 'paid' et décrémente le stock (opération idempotente).
  //
  // En mode test, si l'intent n'est pas encore confirmé, on le confirme côté
  // serveur avec une carte de test (pm_card_visa) pour simuler un paiement réussi
  // — utile pour tester sans frontend Stripe.js.
  async confirm(user, { orderId }) {
    const stripe = getStripe();
    const order = await loadOwnedOrder(user, orderId);

    // Idempotence : si déjà payée, on renvoie la commande telle quelle.
    if (order.status === 'paid') {
      return { order, alreadyPaid: true };
    }

    if (!order.paymentIntentId) {
      throw new ApiError(400, "Aucun PaymentIntent associé : appelez d'abord /api/payment/create-intent");
    }

    let intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

    // Simulation test : confirme avec une carte de test si pas encore réussi.
    if (intent.status !== 'succeeded') {
      intent = await stripe.paymentIntents.confirm(order.paymentIntentId, {
        payment_method: 'pm_card_visa'
      });
    }

    if (intent.status !== 'succeeded') {
      throw new ApiError(402, `Paiement non abouti (statut Stripe : ${intent.status})`);
    }

    // Paiement réussi → finalisation commune (décrément stock + statut 'paid').
    const paidOrder = await finalizePaidOrder(order, { paymentIntentId: intent.id });

    return { order: paidOrder, alreadyPaid: false };
  },

  // Finalise un paiement e-Dinar SIMULÉ (démo). AUCUN appel bancaire/Stripe : le
  // formulaire front a validé le FORMAT de la carte côté client et n'envoie QUE
  // l'orderId (jamais le numéro de carte, le montant ni le statut). Ici, le serveur
  // — seule autorité — vérifie l'ownership et la méthode, puis marque la commande
  // payée et réserve le stock, exactement comme le paiement carte.
  async simulateEdinar(user, { orderId }) {
    const order = await loadOwnedOrder(user, orderId);

    // Idempotence : déjà payée → on renvoie la commande telle quelle.
    if (order.status === 'paid') {
      return { order, alreadyPaid: true };
    }

    // Garde-fou : cet endpoint ne finalise QUE les commandes e-Dinar. On ne
    // détourne pas une commande carte (Stripe) ou COD vers un paiement simulé.
    if (order.paymentMethod !== 'edinar') {
      throw new ApiError(400, "Cette commande n'est pas un paiement e-Dinar");
    }

    const paidOrder = await finalizePaidOrder(order);

    return { order: paidOrder, alreadyPaid: false };
  }
};

module.exports = paymentService;

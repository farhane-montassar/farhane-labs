const orderRepository = require('../repositories/order.repository');
const componentRepository = require('../repositories/component.repository');
const ApiError = require('../utils/ApiError');

// Service Order : logique métier du tunnel d'achat (hors paiement).
//
// RÈGLE DE SÉCURITÉ (comme le configurateur) : on ne fait JAMAIS confiance aux
// données du client. Le prix, le nom et le fournisseur de chaque item sont
// rechargés depuis la base et FIGÉS sur la commande au moment de l'achat.
// Le total est recalculé côté serveur. Le stock n'est PAS décrémenté ici :
// il le sera à la confirmation du paiement (voir payment.service).

// Frais de livraison appliqués UNIQUEMENT au paiement à la livraison (COD).
// Calculés côté serveur ; jamais reçus du client (même règle que le total).
const SHIPPING_FEE = 3;

// Statuts qui interdisent l'annulation (commande déjà acheminée).
const NON_CANCELLABLE = ['shipped', 'delivered'];

function round2(n) {
  return Math.round(n * 100) / 100;
}

// L'id de fournisseur peut être peuplé (objet) ou un ObjectId brut.
function supplierIdOf(component) {
  return component.supplier && component.supplier._id
    ? component.supplier._id
    : component.supplier;
}

const orderService = {
  // user : { id, role }. body : { items: [{ componentId, quantity }], shippingAddress, paymentMethod }
  // paymentMethod : 'card' (défaut, flux Stripe) ou 'cod' (paiement à la livraison).
  async create(user, { items, shippingAddress, paymentMethod = 'card' }) {
    // 1. Recharge les vrais composants depuis la base (en une requête).
    const ids = items.map((it) => it.componentId);
    const found = await componentRepository.findByIds(ids);
    const byId = new Map(found.map((c) => [String(c._id), c]));

    const missing = ids.filter((id) => !byId.has(String(id)));
    if (missing.length) {
      throw new ApiError(404, `Composant(s) introuvable(s) : ${missing.join(', ')}`);
    }

    // 2. Fige chaque item (name/price/supplier depuis la base) et vérifie le stock.
    //    On agrège les quantités si un même composant est listé plusieurs fois.
    const quantities = new Map();
    for (const it of items) {
      const key = String(it.componentId);
      const qty = it.quantity && it.quantity > 0 ? it.quantity : 1;
      quantities.set(key, (quantities.get(key) || 0) + qty);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const [id, quantity] of quantities) {
      const component = byId.get(id);

      if (component.stock < quantity) {
        throw new ApiError(
          400,
          `Stock insuffisant pour ${component.name} : ${quantity} demandé(s), ${component.stock} en stock`
        );
      }

      totalAmount += component.price * quantity;
      orderItems.push({
        component: component._id,
        supplier: supplierIdOf(component),
        name: component.name,   // figé
        price: component.price,  // figé
        quantity
      });
    }

    // 3. Frais de livraison + statut selon la méthode (calculés CÔTÉ SERVEUR).
    //    - cod    : +3 TND de livraison, statut 'pending_cod', stock réservé maintenant.
    //    - card   : pas de frais, statut 'pending' (stock décrémenté au paiement Stripe).
    //    - edinar : paiement EN LIGNE simulé → même traitement que 'card' (pas de frais,
    //               'pending', stock réservé à la finalisation /payment/simulate-edinar).
    // On NORMALISE la méthode et on la PERSISTE telle quelle (un bug précédent
    // écrasait toute méthode non-COD en 'card', ce qui aurait perdu 'edinar').
    const method = ['card', 'cod', 'edinar'].includes(paymentMethod) ? paymentMethod : 'card';
    const isCod = method === 'cod';
    const shippingFee = isCod ? SHIPPING_FEE : 0;

    // Réservation immédiate du stock pour le COD (atomique, jamais négatif).
    // En cas d'échec en cours de route, on restitue ce qui a déjà été décrémenté.
    if (isCod) {
      const reserved = [];
      for (const item of orderItems) {
        const ok = await componentRepository.decrementStock(item.component, item.quantity);
        if (!ok) {
          // Rollback des réservations déjà faites, puis erreur claire.
          for (const done of reserved) {
            await componentRepository.incrementStock(done.component, done.quantity);
          }
          throw new ApiError(400, `Stock insuffisant pour ${item.name} au moment de la réservation`);
        }
        reserved.push(item);
      }
    }

    // 4. Crée la commande.
    //    shippingAddress est PERSISTÉE (indispensable pour livrer, surtout en COD).
    //    On ne fige que les champs attendus par le modèle, pas l'objet brut du client.
    const order = await orderRepository.create({
      user: user.id,
      items: orderItems,
      totalAmount: round2(totalAmount + shippingFee),
      shippingFee,
      paymentMethod: method,
      status: isCod ? 'pending_cod' : 'pending',
      stockReserved: isCod, // carte : réservé seulement au paiement
      shippingAddress: shippingAddress
        ? {
            street: shippingAddress.street,
            city: shippingAddress.city,
            zip: shippingAddress.zip,
            country: shippingAddress.country,
            phone: shippingAddress.phone
          }
        : undefined
    });

    return orderRepository.findById(order._id);
  },

  // Annulation d'une commande : propriétaire ou admin. Restitue le stock si la
  // commande l'avait réservé (COD, ou carte payée), avec idempotence stricte.
  async cancel(user, id) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new ApiError(404, 'Commande introuvable');
    }

    const ownerId = order.user && order.user._id ? order.user._id : order.user;
    if (user.role !== 'admin' && String(ownerId) !== String(user.id)) {
      throw new ApiError(403, 'Accès refusé : cette commande ne vous appartient pas');
    }

    // Idempotence : déjà annulée → no-op (aucun double réincrément possible).
    if (order.status === 'cancelled') {
      return order;
    }

    // Commande déjà acheminée : on n'annule pas (hors périmètre).
    if (NON_CANCELLABLE.includes(order.status)) {
      throw new ApiError(400, `Annulation impossible : commande ${order.status}`);
    }

    // Restitution du stock UNIQUEMENT si cette commande l'avait réservé.
    // Le flag stockReserved (et non le statut) tranche : une carte 'pending'
    // n'a jamais décrémenté → pas de réincrément. On remet le flag à false pour
    // qu'un appel ultérieur ne réincrémente jamais deux fois.
    if (order.stockReserved) {
      for (const item of order.items) {
        const componentId = item.component && item.component._id ? item.component._id : item.component;
        await componentRepository.incrementStock(componentId, item.quantity);
      }
    }

    return orderRepository.updateById(order._id, { status: 'cancelled', stockReserved: false });
  },

  // Les commandes de l'utilisateur connecté.
  async listMine(user) {
    return orderRepository.findByUser(user.id);
  },

  // Détail d'une commande : réservé au propriétaire ou à un admin.
  async getById(user, id) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new ApiError(404, 'Commande introuvable');
    }

    const ownerId = order.user && order.user._id ? order.user._id : order.user;
    if (user.role !== 'admin' && String(ownerId) !== String(user.id)) {
      throw new ApiError(403, 'Accès refusé : cette commande ne vous appartient pas');
    }

    return order;
  }
};

module.exports = orderService;

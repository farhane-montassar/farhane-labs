import api from './api'

/**
 * Paiement Stripe. Renvoie directement `data`.
 *
 * Backend (rôle client) :
 *  - POST /payment/create-intent { orderId } -> { clientSecret, paymentIntentId, amount, currency }
 *  - POST /payment/confirm       { orderId } -> commande mise à jour (status 'paid')
 *
 * Flux front : create-intent -> stripe.confirmCardPayment(clientSecret, …) côté
 * client (vraie carte) -> une fois l'intent `succeeded`, confirm() finalise côté
 * serveur (statut + décrément du stock). L'intent étant déjà confirmé, le backend
 * ne refait PAS de confirmation de test.
 */
export const paymentService = {
  async createIntent(orderId) {
    const res = await api.post('/payment/create-intent', { orderId })
    return res.data.data
  },

  async confirm(orderId) {
    const res = await api.post('/payment/confirm', { orderId })
    return res.data.data
  },

  // Finalise un paiement e-Dinar SIMULÉ (démo). On n'envoie QUE l'orderId :
  // aucune donnée de carte ne transite par le serveur. Le backend marque la
  // commande payée et décrémente le stock (montant/statut maîtrisés serveur).
  async simulateEdinar(orderId) {
    const res = await api.post('/payment/simulate-edinar', { orderId })
    return res.data.data
  },
}

export default paymentService

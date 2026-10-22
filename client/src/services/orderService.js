import api from './api'

/**
 * Commandes (tunnel d'achat). Comme les autres services, renvoie directement `data`.
 *
 * Backend (rôle client) :
 *  - POST  /orders            { items:[{componentId,quantity}], shippingAddress, paymentMethod } -> commande créée
 *  - GET   /orders/me         -> [ mes commandes ]
 *  - GET   /orders/:id        -> détail (propriétaire ou admin)
 *  - PATCH /orders/:id/cancel -> annule la commande (restitue le stock réservé)
 *
 * Le totalAmount (et les frais de livraison COD) sont TOUJOURS recalculés côté
 * serveur. Le client n'envoie que la méthode choisie ('card' | 'cod').
 */
export const orderService = {
  async create({ items, shippingAddress, paymentMethod = 'card' }) {
    const res = await api.post('/orders', { items, shippingAddress, paymentMethod })
    return res.data.data
  },

  async cancel(id) {
    const res = await api.patch(`/orders/${id}/cancel`)
    return res.data.data
  },

  async listMine() {
    const res = await api.get('/orders/me')
    return res.data.data
  },

  async getById(id) {
    const res = await api.get(`/orders/${id}`)
    return res.data.data
  },
}

export default orderService

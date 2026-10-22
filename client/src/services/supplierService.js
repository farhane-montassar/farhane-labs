import api from './api'

/**
 * Dashboard fournisseur. Renvoie directement `data`.
 * Réservé au rôle supplier APPROUVÉ ; le backend déduit le fournisseur du token
 * et ne renvoie QUE ses propres données (composants, commandes, stats).
 *
 * Backend (voir server/README.md, endpoints 23-25) :
 *  - GET /supplier/components -> [ ses composants ]
 *  - GET /supplier/orders     -> [ commandes contenant ses produits, items filtrés + supplierSubtotal ]
 *  - GET /supplier/stats      -> { componentCount, orderCount, paidOrderCount, totalSales, lowStock:[...] }
 */
export const supplierService = {
  async getComponents() {
    const res = await api.get('/supplier/components')
    return res.data.data
  },

  async getOrders() {
    const res = await api.get('/supplier/orders')
    return res.data.data
  },

  async getStats() {
    const res = await api.get('/supplier/stats')
    return res.data.data
  },
}

export default supplierService

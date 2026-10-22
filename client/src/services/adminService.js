import api from './api'

/**
 * Dashboard admin. Renvoie directement `data`. Réservé au rôle admin (403 sinon).
 *
 * Backend (voir server/README.md, endpoints 26-30) :
 *  - GET   /admin/suppliers?status=        -> [ fournisseurs (user peuplé: name,email) ]
 *  - PATCH /admin/suppliers/:id/approve     -> fournisseur (status 'approved')
 *  - PATCH /admin/suppliers/:id/reject      -> fournisseur (status 'rejected')
 *  - GET   /admin/users?role=               -> [ utilisateurs (sans password) ]
 *  - GET   /admin/orders                    -> [ toutes les commandes ]
 *  - GET   /admin/stats                     -> { userCount, suppliers:{...}, componentCount, orderCount, paidOrderCount, totalRevenue }
 */
export const adminService = {
  async getSuppliers(status) {
    const res = await api.get('/admin/suppliers', { params: status ? { status } : {} })
    return res.data.data
  },

  async approveSupplier(id) {
    const res = await api.patch(`/admin/suppliers/${id}/approve`)
    return res.data.data
  },

  async rejectSupplier(id) {
    const res = await api.patch(`/admin/suppliers/${id}/reject`)
    return res.data.data
  },

  async getUsers(role) {
    const res = await api.get('/admin/users', { params: role ? { role } : {} })
    return res.data.data
  },

  async getOrders() {
    const res = await api.get('/admin/orders')
    return res.data.data
  },

  async getStats() {
    const res = await api.get('/admin/stats')
    return res.data.data
  },
}

export default adminService

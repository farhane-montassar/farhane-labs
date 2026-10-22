import api from './api'

/**
 * Demandes de composant (client crée/voit ; supplier/admin traitent).
 * Comme les autres services, on renvoie directement `data`.
 *
 * Backend :
 *  - POST  /component-requests            (client)        -> la demande créée
 *  - GET   /component-requests/me         (client)        -> [ mes demandes ]
 *  - GET   /component-requests?status=    (supplier/admin)-> [ demandes à traiter ]
 *  - PATCH /component-requests/:id/fulfill(supplier/admin)-> la demande satisfaite
 */
export const componentRequestService = {
  async create({ componentName, description }) {
    const res = await api.post('/component-requests', { componentName, description })
    return res.data.data
  },

  async listMine() {
    const res = await api.get('/component-requests/me')
    return res.data.data
  },

  async listAll(status) {
    const res = await api.get('/component-requests', { params: status ? { status } : {} })
    return res.data.data
  },

  async fulfill(id, componentId) {
    const res = await api.patch(`/component-requests/${id}/fulfill`, { componentId })
    return res.data.data
  },
}

export default componentRequestService

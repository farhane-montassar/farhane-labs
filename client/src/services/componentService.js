import api from './api'

/**
 * Appels liés au catalogue (composants) et à leurs avis.
 * Chaque fonction retourne directement `data` (le contenu utile),
 * comme authService : l'UI n'a pas à connaître l'enveloppe { success, data, message }.
 *
 * Backend (voir server/README.md) :
 *  - GET /components            -> data = { items, total, page, pages, limit }
 *  - GET /components/:id        -> data = le composant (supplier peuplé)
 *  - GET /components/:id/reviews-> data = [ { rating, comment, user:{name}, createdAt } ]
 *
 * Le filtrage/tri/pagination se fait CÔTÉ BACKEND : on transmet les query params tels quels.
 */
export const componentService = {
  // params : { search, category, voltage, minPrice, maxPrice, sort, page, limit }
  // Les clés vides/null sont retirées pour ne pas polluer l'URL de l'API.
  async list(params = {}) {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
    )
    const res = await api.get('/components', { params: cleaned })
    return res.data.data // { items, total, page, pages, limit }
  },

  async getById(id) {
    const res = await api.get(`/components/${id}`)
    return res.data.data
  },

  async getReviews(id) {
    const res = await api.get(`/components/${id}/reviews`)
    return res.data.data // [ ... ]
  },

  // --- CRUD (fournisseur approuvé / admin). Le backend gère l'ownership. ---
  // Le supplier est déduit du token (fournisseur) ; un admin doit fournir supplierId.
  async create(payload) {
    const res = await api.post('/components', payload)
    return res.data.data
  },

  async update(id, payload) {
    const res = await api.put(`/components/${id}`, payload)
    return res.data.data
  },

  async remove(id) {
    const res = await api.delete(`/components/${id}`)
    return res.data.data // { id }
  },
}

export default componentService

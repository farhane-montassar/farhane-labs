import api from './api'

/**
 * Appels liés aux kits (configurations sauvegardées).
 * Comme les autres services, on renvoie directement `data`.
 *
 * Backend :
 *  - POST /kits   -> data = le kit créé (board + composants peuplés). Rôle client.
 *  - GET  /kits   -> data = [ kits du user connecté ]
 *
 * Le backend re-valide TOUJOURS la config avant de persister (statut + prix réels).
 */
export const kitService = {
  async create({ name, boardId, items }) {
    const res = await api.post('/kits', { name, boardId, items })
    return res.data.data
  },

  async listMine() {
    const res = await api.get('/kits')
    return res.data.data
  },
}

export default kitService

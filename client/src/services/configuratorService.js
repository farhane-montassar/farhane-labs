import api from './api'

/**
 * Appels du configurateur. La validation passe TOUJOURS par le backend
 * (source de vérité de la compatibilité) — aucune logique métier côté front.
 *
 * Backend : POST /api/configurator/validate  — authentifié (tout rôle).
 *   body : { boardId, items: [{ componentId, quantity }] }  (items non vide)
 *   data : { status, messages, usedPins, availablePins, totalPrice }
 */
export const configuratorService = {
  async validate({ boardId, items }) {
    const res = await api.post('/configurator/validate', { boardId, items })
    return res.data.data
  },
}

export default configuratorService

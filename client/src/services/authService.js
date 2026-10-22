import api from './api'

/**
 * Appels liés à l'authentification.
 * Chaque fonction retourne directement `data` (le contenu utile),
 * la couche supérieure (AuthContext) n'a pas à connaître l'enveloppe HTTP.
 *
 * Backend (voir server/README.md) :
 *  - POST /auth/register -> data = { user, token }
 *  - POST /auth/login    -> data = { user, token }  (token dans data.token)
 *  - GET  /auth/me       -> data = { id, name, email, role }
 */
export const authService = {
  async register({ name, email, password }) {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data.data // { user, token }
  },

  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password })
    return res.data.data // { user, token }
  },

  async me() {
    const res = await api.get('/auth/me')
    return res.data.data // { id, name, email, role }
  },
}

export default authService

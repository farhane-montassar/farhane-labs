import axios from 'axios'

/**
 * Service axios centralisé.
 * - baseURL depuis VITE_API_URL (défaut http://localhost:5000/api)
 * - intercepteur REQUEST : ajoute automatiquement le token Bearer
 * - intercepteur RESPONSE : normalise les erreurs (message du backend)
 *
 * Le backend renvoie { success, data, message }. On laisse les réponses
 * brutes ici (les services métier extraient `data`), mais on uniformise
 * les erreurs pour que l'UI puisse toujours afficher un message clair.
 */

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Clé de stockage du token (réutilisée par l'AuthContext)
export const TOKEN_KEY = 'farhane_token'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// --- REQUEST : injecte le token Bearer si présent ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- RESPONSE : gestion centralisée des erreurs ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Message renvoyé par le backend ({ success:false, message }) sinon fallback
    const message =
      error.response?.data?.message ||
      error.message ||
      'Une erreur réseau est survenue.'

    const status = error.response?.status

    // 401 : token invalide/expiré → on purge la session locale.
    // (La redirection est gérée par les ProtectedRoute / l'AuthContext.)
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY)
    }

    // On rejette avec un objet enrichi et exploitable par l'UI
    return Promise.reject({ message, status, raw: error })
  },
)

export default api

import { createContext, useCallback, useEffect, useState } from 'react'
import { authService } from '@/services/authService'
import { TOKEN_KEY } from '@/services/api'

/**
 * AuthContext — état global d'authentification.
 *
 * Expose : { user, token, loading, isAuthenticated, login, register, logout, hasRole }
 *  - persistance du token dans localStorage
 *  - au démarrage : si un token existe, on recharge l'utilisateur via /auth/me
 */
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  // loading = true tant qu'on n'a pas résolu l'état initial (évite les flashs)
  const [loading, setLoading] = useState(true)

  // Centralise l'écriture du token (state + localStorage)
  const persistToken = (value) => {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
    setToken(value)
  }

  // Au montage : recharge l'utilisateur si un token est présent
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (!stored) {
        setLoading(false)
        return
      }
      try {
        const me = await authService.me()
        if (!cancelled) setUser(me)
      } catch {
        // token invalide/expiré → on nettoie
        if (!cancelled) {
          persistToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (credentials) => {
    const { user: u, token: t } = await authService.login(credentials)
    persistToken(t)
    setUser(u)
    return u
  }

  const register = async (payload) => {
    const { user: u, token: t } = await authService.register(payload)
    persistToken(t)
    setUser(u)
    return u
  }

  const logout = () => {
    persistToken(null)
    setUser(null)
  }

  // Vérifie un rôle (string) ou plusieurs (array)
  const hasRole = (roles) => {
    if (!user) return false
    if (!roles) return true
    const list = Array.isArray(roles) ? roles : [roles]
    return list.includes(user.role)
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

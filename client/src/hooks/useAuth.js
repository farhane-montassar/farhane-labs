import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

/**
 * useAuth — raccourci d'accès au contexte d'authentification.
 * Lève une erreur si utilisé hors d'un <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un <AuthProvider>')
  }
  return ctx
}

export default useAuth

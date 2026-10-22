import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'

/**
 * ProtectedRoute — protège une (ou plusieurs) routes.
 *
 * Usage :
 *   <Route element={<ProtectedRoute />}>...</Route>            // connecté requis
 *   <Route element={<ProtectedRoute roles="admin" />}>...</Route>
 *   <Route element={<ProtectedRoute roles={['admin','supplier']} />}>...</Route>
 *
 * Comportement :
 *  - tant que l'auth se charge → spinner (évite une redirection prématurée)
 *  - non connecté → redirige vers /login (en mémorisant la page demandée)
 *  - rôle insuffisant → redirige vers /unauthorized
 *
 * Rend <Outlet /> via children OU s'utilise comme layout de route.
 */
import { Outlet } from 'react-router-dom'

export default function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, loading, hasRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // On garde l'URL d'origine pour rediriger après connexion
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children ? children : <Outlet />
}

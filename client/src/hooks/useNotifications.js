import { useContext } from 'react'
import { NotificationsContext } from '@/context/NotificationsContext'

/**
 * useNotifications — raccourci d'accès au contexte des notifications.
 * Lève une erreur si utilisé hors d'un <NotificationsProvider>.
 */
export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications doit être utilisé à l’intérieur d’un <NotificationsProvider>')
  }
  return ctx
}

export default useNotifications

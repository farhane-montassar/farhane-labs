import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { notificationService } from '@/services/notificationService'

/**
 * NotificationsContext — état partagé des notifications de l'utilisateur connecté.
 *
 * Objectif : POLLING LÉGER mutualisé. Seul le compte des non-lues est rafraîchi
 * automatiquement (au montage puis toutes les 30s) ; la liste complète n'est chargée
 * qu'à la demande (ouverture du panneau). Un seul provider → un seul timer, partagé
 * entre la cloche desktop et mobile.
 *
 * NB : volontairement sans WebSocket. Socket.IO serait l'évolution naturelle pour du
 * vrai temps réel (push serveur → client) ; ici on reste sur du polling simple.
 *
 * Expose : { unreadCount, items, loading, refreshCount, loadList, markRead, markAllRead }
 */
export const NotificationsContext = createContext(null)

const POLL_INTERVAL_MS = 30_000

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  // Rafraîchit UNIQUEMENT le compteur (léger). Silencieux en cas d'erreur réseau.
  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationService.unreadCount()
      setUnreadCount(count)
    } catch {
      /* réseau indisponible : on garde la dernière valeur connue */
    }
  }, [])

  // Charge la liste complète (à l'ouverture du panneau) + recale le compteur.
  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationService.list()
      setItems(data.items || [])
      setUnreadCount(data.unreadCount ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  const markRead = useCallback(async (id) => {
    await notificationService.markRead(id)
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead()
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  // Polling : actif seulement quand authentifié. On se met en pause si l'onglet est
  // caché (économise les requêtes) et on rafraîchit dès qu'il redevient visible.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      setItems([])
      return
    }

    refreshCount()

    const tick = () => {
      if (!document.hidden) refreshCount()
    }
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS)

    const onVisible = () => {
      if (!document.hidden) refreshCount()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isAuthenticated, refreshCount])

  const value = { unreadCount, items, loading, refreshCount, loadList, markRead, markAllRead }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

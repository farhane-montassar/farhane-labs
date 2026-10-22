import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

/**
 * NotificationBell — cloche de la navbar (utilisateur connecté uniquement).
 *
 * - Badge du nombre de non-lues (depuis le polling léger du contexte).
 * - Au clic : panneau déroulant ; la liste complète n'est chargée qu'à l'ouverture.
 * - Clic sur une notif → marquée lue + navigation vers son `link` éventuel.
 * - « Tout marquer comme lu » d'un coup.
 */

// Libellés FR + variante de Badge par type de notification.
const TYPE_META = {
  info: { label: 'Info', variant: 'primary' },
  order: { label: 'Commande', variant: 'success' },
  supplier: { label: 'Fournisseur', variant: 'accent' },
  component_request: { label: 'Demande', variant: 'warning' },
  component_available: { label: 'Disponible', variant: 'success' },
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationBell() {
  const { unreadCount, items, loading, loadList, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) loadList() // liste complète seulement à l'ouverture
  }

  const handleClick = async (n) => {
    if (!n.read) {
      try {
        await markRead(n._id)
      } catch {
        /* on navigue quand même : l'échec du marquage ne doit pas bloquer */
      }
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-slate-100"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-error-500 px-1 text-xs font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay invisible pour fermer au clic extérieur (même mécanique que le menu) */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-elevated">
            {/* En-tête */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-primary-700 transition-colors hover:text-primary-800"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Corps */}
            <div className="max-h-[22rem] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted">
                  <Spinner size="sm" />
                  <span className="text-sm">Chargement…</span>
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">Aucune notification.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((n) => {
                    const meta = TYPE_META[n.type] || TYPE_META.info
                    return (
                      <li key={n._id}>
                        <button
                          type="button"
                          onClick={() => handleClick(n)}
                          className={`flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${n.read ? '' : 'bg-primary-50/60'}`}
                        >
                          {/* Pastille lu/non-lu */}
                          <span className="mt-1.5 shrink-0" aria-hidden>
                            <span className={`block h-2 w-2 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary-600'}`} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className={`truncate text-sm ${n.read ? 'font-medium text-ink' : 'font-semibold text-navy'}`}>
                                {n.title}
                              </span>
                              <Badge variant={meta.variant} className="shrink-0">{meta.label}</Badge>
                            </span>
                            <span className="mt-0.5 block text-sm leading-snug text-muted">{n.message}</span>
                            <span className="mt-1 block text-xs text-slate-400">{formatDate(n.createdAt)}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

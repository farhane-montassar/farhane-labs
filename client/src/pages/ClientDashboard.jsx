import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/orderService'
import { kitService } from '@/services/kitService'
import { componentRequestService } from '@/services/componentRequestService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import StatCard from '@/components/dashboard/StatCard'
import RequestComponentModal from '@/components/requests/RequestComponentModal'
import { requestStatus } from '@/utils/componentRequests'

/**
 * ClientDashboard — /mon-compte (ProtectedRoute role 'client').
 * Tableau de bord client : petites stats (commandes, kits) + accès rapide aux
 * pages existantes (Mes commandes, Mes kits, Mon profil). Aucune logique dupliquée.
 */
export default function ClientDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [kits, setKits] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)

  const loadRequests = () => componentRequestService.listMine().then((r) => setRequests(r || []))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([orderService.listMine(), kitService.listMine(), componentRequestService.listMine()])
      .then(([o, k, r]) => {
        if (!cancelled) {
          setOrders(o || [])
          setKits(k || [])
          setRequests(r || [])
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Impossible de charger votre tableau de bord.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const paidCount = orders.filter((o) => o.status === 'paid').length

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Bonjour {user?.name?.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-muted">Bienvenue dans votre espace personnel.</p>
      </header>

      {error && (
        <Alert variant="error" title="Erreur" className="mb-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-24 text-primary-600">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Petites stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Commandes" value={orders.length} icon="📦" accent="primary" hint={`${paidCount} payée(s)`} />
            <StatCard label="Kits sauvegardés" value={kits.length} icon="🧩" accent="success" />
            <StatCard label="Mes demandes" value={requests.length} icon="📨" accent="neutral" />
            <StatCard label="Compte" value={user?.email ? 'Actif' : '—'} icon="👤" accent="neutral" hint={user?.email} />
          </div>

          {/* Mes demandes de composant */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-navy">Mes demandes de composant</h2>
              <Button size="sm" onClick={() => setRequestOpen(true)}>
                + Faire une demande
              </Button>
            </div>
            {requests.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">
                  Vous n'avez pas encore fait de demande. Un composant manque au catalogue ? Demandez-le, les
                  fournisseurs seront notifiés.
                </p>
              </Card>
            ) : (
              <Card padded={false} className="overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {requests.map((r) => {
                    const s = requestStatus(r.status)
                    const date = r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : null
                    return (
                      <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink">{r.componentName}</span>
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </div>
                          {r.description && <p className="mt-0.5 truncate text-sm text-muted">{r.description}</p>}
                          {date && <p className="mt-0.5 text-xs text-slate-400">Demandé le {date}</p>}
                        </div>
                        {r.status === 'fulfilled' && r.fulfilledComponent && (
                          <Button as={Link} to={`/components/${r.fulfilledComponent._id}`} variant="secondary" size="sm">
                            Voir « {r.fulfilledComponent.name} »
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )}
          </div>

          {/* Accès rapide */}
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-navy">Accès rapide</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <QuickLink
                to="/mes-commandes"
                icon="📦"
                title="Mes commandes"
                desc="Suivi, détails et annulation de vos commandes."
              />
              <QuickLink
                to="/mes-kits"
                icon="🧩"
                title="Mes kits"
                desc="Vos configurations sauvegardées."
              />
              <QuickLink to="/profil" icon="👤" title="Mon profil" desc="Vos informations de compte." />
            </div>
          </div>

          {/* Continuer les achats */}
          <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-navy to-primary-900 text-white">
            <div>
              <h2 className="font-display text-lg font-semibold">Envie de composer un nouveau montage ?</h2>
              <p className="mt-1 text-sm text-white/80">Parcourez le catalogue ou ouvrez le configurateur.</p>
            </div>
            <div className="flex gap-3">
              <Button as={Link} to="/catalogue" variant="secondary">
                Catalogue
              </Button>
              <Button as={Link} to="/configurateur" variant="secondary">
                Configurateur
              </Button>
            </div>
          </Card>
        </div>
      )}

      {requestOpen && (
        <RequestComponentModal
          onClose={() => setRequestOpen(false)}
          onCreated={loadRequests}
        />
      )}
    </div>
  )
}

function QuickLink({ to, icon, title, desc }) {
  return (
    <Card as={Link} to={to} hover className="block">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-50 text-xl" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-navy">{title}</h3>
          <p className="mt-0.5 text-sm text-muted">{desc}</p>
        </div>
      </div>
    </Card>
  )
}

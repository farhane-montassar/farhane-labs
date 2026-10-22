import { useEffect, useState } from 'react'
import { componentRequestService } from '@/services/componentRequestService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { requestStatus } from '@/utils/componentRequests'

/**
 * RequestsSection — onglet « Demandes de composants » du dashboard fournisseur.
 *
 * Liste les demandes (GET /component-requests, filtrable par statut). Pour une demande
 * en attente, le fournisseur peut la marquer satisfaite en la liant à UN de ses
 * composants → le client demandeur reçoit alors une notification « disponible ».
 *
 * props :
 *  - components : les composants du fournisseur (pour le menu de liaison)
 */
const FILTERS = [
  { value: 'pending', label: 'En attente' },
  { value: '', label: 'Toutes' },
  { value: 'fulfilled', label: 'Satisfaites' },
]

export default function RequestsSection({ components = [] }) {
  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)
  // Composant sélectionné par demande (pour la liaison) : { [requestId]: componentId }
  const [selection, setSelection] = useState({})

  const load = (status) => {
    setLoading(true)
    setError('')
    componentRequestService
      .listAll(status)
      .then((r) => setRequests(r || []))
      .catch((err) => setError(err.message || 'Impossible de charger les demandes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(statusFilter)
  }, [statusFilter])

  const handleFulfill = async (request) => {
    const componentId = selection[request._id]
    if (!componentId) {
      setActionError('Sélectionnez d\'abord un composant à lier.')
      return
    }
    setActionError('')
    setBusyId(request._id)
    try {
      await componentRequestService.fulfill(request._id, componentId)
      load(statusFilter) // rafraîchit (le client a été notifié côté backend)
    } catch (err) {
      setActionError(err.message || 'L\'action a échoué.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-navy">Demandes de composants</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="req-filter" className="text-sm text-muted">Statut</label>
          <select
            id="req-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <Alert variant="error" title="Erreur">{error}</Alert>}
      {actionError && <Alert variant="error" title="Erreur">{actionError}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16 text-primary-600">
          <Spinner size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-ink">Aucune demande</p>
          <p className="mt-1 text-sm text-muted">Les demandes des clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const s = requestStatus(r.status)
            const date = r.createdAt
              ? new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : null
            return (
              <Card key={r._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-navy">{r.componentName}</h3>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                    {r.description && <p className="mt-1 text-sm text-ink">{r.description}</p>}
                    <p className="mt-1 text-xs text-muted">
                      Par {r.client?.name || 'Client'}{date ? ` · ${date}` : ''}
                    </p>
                  </div>
                </div>

                {r.status === 'fulfilled' ? (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-muted">
                    Satisfaite{r.fulfilledComponent ? ` par « ${r.fulfilledComponent.name} »` : ''}.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <select
                      value={selection[r._id] || ''}
                      onChange={(e) => setSelection((sel) => ({ ...sel, [r._id]: e.target.value }))}
                      className="h-9 min-w-[12rem] flex-1 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    >
                      <option value="">Lier à un de mes composants…</option>
                      {components.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleFulfill(r)}
                      loading={busyId === r._id}
                      disabled={components.length === 0}
                    >
                      Marquer comme satisfaite
                    </Button>
                  </div>
                )}
                {components.length === 0 && r.status !== 'fulfilled' && (
                  <p className="mt-2 text-xs text-muted">Ajoutez d'abord un composant à votre catalogue pour pouvoir lier cette demande.</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supplierService } from '@/services/supplierService'
import { componentService } from '@/services/componentService'
import { componentRequestService } from '@/services/componentRequestService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import ComponentImage from '@/components/catalogue/ComponentImage'
import StatCard from '@/components/dashboard/StatCard'
import Tabs from '@/components/dashboard/Tabs'
import ComponentForm from '@/components/supplier/ComponentForm'
import RequestsSection from '@/components/supplier/RequestsSection'
import { categoryLabel, formatPrice, stockStatus } from '@/utils/catalogue'
import { orderStatus, paymentMethodOf } from '@/utils/orders'

// Onglets connus du dashboard (sert à valider le paramètre d'URL ?tab=…).
const TAB_IDS = ['overview', 'components', 'orders', 'requests']

/**
 * SupplierDashboard — /fournisseur (ProtectedRoute role 'supplier').
 * Vue d'ensemble (stats), gestion de SES composants (CRUD) et SES commandes.
 * Toutes les données viennent du backend, filtrées au fournisseur via le token.
 */
export default function SupplierDashboard() {
  // L'onglet actif peut être ouvert directement via ?tab=… (ex. clic sur une notif
  // « Demande de composant » qui pointe vers /fournisseur?tab=requests).
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = TAB_IDS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview'
  const [tab, setTab] = useState(initialTab)
  const [stats, setStats] = useState(null)
  const [components, setComponents] = useState([])
  const [orders, setOrders] = useState([])
  const [pendingRequests, setPendingRequests] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Garde l'onglet synchronisé si le paramètre d'URL change (navigation via la cloche
  // alors que la page est déjà montée).
  useEffect(() => {
    const fromUrl = searchParams.get('tab')
    if (fromUrl && TAB_IDS.includes(fromUrl) && fromUrl !== tab) setTab(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Le clic sur un onglet reflète le choix dans l'URL (lien partageable, retour arrière).
  const changeTab = (id) => {
    setTab(id)
    setSearchParams(id === 'overview' ? {} : { tab: id }, { replace: true })
  }

  // Modale de création/édition + état de suppression.
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState('')

  const loadAll = () => {
    setLoading(true)
    setError('')
    Promise.all([
      supplierService.getStats(),
      supplierService.getComponents(),
      supplierService.getOrders(),
      componentRequestService.listAll('pending'),
    ])
      .then(([s, c, o, reqs]) => {
        setStats(s)
        setComponents(c || [])
        setOrders(o || [])
        setPendingRequests((reqs || []).length)
      })
      .catch((err) => setError(err.message || 'Impossible de charger le tableau de bord.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  const openCreate = () => {
    setEditing(null)
    setActionError('')
    setFormOpen(true)
  }
  const openEdit = (component) => {
    setEditing(component)
    setActionError('')
    setFormOpen(true)
  }

  // Après création/édition : on referme et on rafraîchit (stats + liste).
  const handleSaved = () => {
    setFormOpen(false)
    setEditing(null)
    loadAll()
  }

  const handleDelete = async (component) => {
    if (!window.confirm(`Supprimer « ${component.name} » ? Cette action est définitive.`)) return
    setActionError('')
    try {
      await componentService.remove(component._id)
      loadAll()
    } catch (err) {
      setActionError(err.message || 'La suppression a échoué.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-primary-600">
        <Spinner size="lg" />
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'components', label: 'Mes composants', badge: components.length },
    { id: 'orders', label: 'Mes commandes', badge: orders.length },
    { id: 'requests', label: 'Demandes de composants', badge: pendingRequests || undefined },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Espace fournisseur</h1>
        <p className="mt-1 text-muted">Gérez vos composants, suivez vos ventes et vos commandes.</p>
      </header>

      {error && (
        <Alert variant="error" title="Erreur" className="mb-6">
          {error}
        </Alert>
      )}

      <Tabs tabs={tabs} value={tab} onChange={changeTab} />

      <div className="mt-6">
        {tab === 'overview' && <Overview stats={stats} />}
        {tab === 'components' && (
          <ComponentsSection
            components={components}
            actionError={actionError}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
        {tab === 'orders' && <OrdersSection orders={orders} />}
        {tab === 'requests' && <RequestsSection components={components} />}
      </div>

      {formOpen && (
        <ComponentForm component={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

function Overview({ stats }) {
  if (!stats) return null
  const lowStock = stats.lowStock || []
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Composants" value={stats.componentCount ?? 0} icon="🔧" accent="primary" />
        <StatCard label="Total des ventes" value={formatPrice(stats.totalSales ?? 0)} icon="💰" accent="success" />
        <StatCard
          label="Commandes"
          value={stats.orderCount ?? 0}
          icon="📦"
          accent="neutral"
          hint={`${stats.paidOrderCount ?? 0} payée(s)`}
        />
        <StatCard label="Stock faible" value={lowStock.length} icon="⚠️" accent="warning" />
      </div>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">Alertes de stock faible</h2>
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted">Aucun composant en stock faible. 👍</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lowStock.map((c) => (
              <li key={c._id} className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium text-ink">{c.name}</span>
                <Badge variant="warning">Stock : {c.stock}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function ComponentsSection({ components, actionError, onCreate, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-navy">Mes composants</h2>
        <Button size="sm" onClick={onCreate}>
          + Nouveau composant
        </Button>
      </div>

      {actionError && (
        <Alert variant="error" title="Erreur">
          {actionError}
        </Alert>
      )}

      {components.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-ink">Aucun composant</p>
          <p className="mt-1 text-sm text-muted">Ajoutez votre premier composant au catalogue.</p>
          <Button className="mt-6" onClick={onCreate}>
            + Nouveau composant
          </Button>
        </div>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Composant</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Prix</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((c) => {
                  const stock = stockStatus(c.stock)
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ComponentImage
                            src={c.images?.[0]}
                            alt={c.name}
                            category={c.category}
                            className="h-10 w-10 shrink-0 rounded-md border border-slate-200"
                          />
                          <span className="font-medium text-ink">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{categoryLabel(c.category)}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-ink">{formatPrice(c.price)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={stock.variant}>{c.stock}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => onEdit(c)}>
                            Modifier
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => onDelete(c)}>
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function OrdersSection({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-lg font-semibold text-ink">Aucune commande</p>
        <p className="mt-1 text-sm text-muted">Les commandes contenant vos produits apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const status = orderStatus(order.status)
        const method = paymentMethodOf(order.paymentMethod)
        const date = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
          : null
        return (
          <Card key={order._id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted">#{order._id.slice(-8)}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge variant="neutral">{method.short}</Badge>
                </div>
                {date && <p className="mt-1 text-xs text-muted">Passée le {date}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Mon sous-total</p>
                <p className="font-mono text-lg font-bold text-navy">{formatPrice(order.supplierSubtotal ?? 0)}</p>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {order.items?.map((line) => (
                <li key={line._id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">
                    {line.name} <span className="text-muted">× {line.quantity}</span>
                  </span>
                  <span className="font-mono text-ink">{formatPrice((line.price || 0) * line.quantity)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}

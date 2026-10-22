import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import StatCard from '@/components/dashboard/StatCard'
import Tabs from '@/components/dashboard/Tabs'
import { cn } from '@/utils/cn'
import { formatPrice } from '@/utils/catalogue'
import { orderStatus, paymentMethodOf } from '@/utils/orders'

/**
 * AdminDashboard — /admin (ProtectedRoute role 'admin').
 * Vue d'ensemble (stats globales), validation des fournisseurs (approuver/refuser),
 * liste des utilisateurs et de toutes les commandes. Données 100 % backend réel.
 */

// Statut fournisseur → libellé + variante de Badge.
const SUPPLIER_STATUS = {
  pending: { label: 'En attente', variant: 'warning' },
  approved: { label: 'Approuvé', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'error' },
}
const ROLE_LABELS = { client: 'Client', supplier: 'Fournisseur', admin: 'Admin' }
const ROLE_VARIANTS = { client: 'primary', supplier: 'accent', admin: 'warning' }

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAll = () => {
    setLoading(true)
    setError('')
    Promise.all([adminService.getStats(), adminService.getSuppliers(), adminService.getUsers(), adminService.getOrders()])
      .then(([s, sup, u, o]) => {
        setStats(s)
        setSuppliers(sup || [])
        setUsers(u || [])
        setOrders(o || [])
      })
      .catch((err) => setError(err.message || "Impossible de charger l'administration."))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  // Met à jour un fournisseur dans la liste + rafraîchit les stats (compteurs par statut).
  const applySupplierUpdate = (updated) => {
    setSuppliers((list) => list.map((s) => (s._id === updated._id ? { ...s, ...updated } : s)))
    adminService.getStats().then(setStats).catch(() => {})
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-primary-600">
        <Spinner size="lg" />
      </div>
    )
  }

  const pendingCount = suppliers.filter((s) => s.status === 'pending').length
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'suppliers', label: 'Fournisseurs', badge: pendingCount || undefined },
    { id: 'users', label: 'Utilisateurs', badge: users.length },
    { id: 'orders', label: 'Commandes', badge: orders.length },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="mt-1 text-muted">Pilotage de la marketplace : fournisseurs, utilisateurs et commandes.</p>
      </header>

      {error && (
        <Alert variant="error" title="Erreur" className="mb-6">
          {error}
        </Alert>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'overview' && <Overview stats={stats} />}
        {tab === 'suppliers' && <SuppliersSection suppliers={suppliers} onUpdated={applySupplierUpdate} />}
        {tab === 'users' && <UsersSection users={users} />}
        {tab === 'orders' && <OrdersSection orders={orders} />}
      </div>
    </div>
  )
}

function Overview({ stats }) {
  if (!stats) return null
  const sup = stats.suppliers || {}
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats.userCount ?? 0} icon="👥" accent="primary" />
        <StatCard label="Composants" value={stats.componentCount ?? 0} icon="🔧" accent="neutral" />
        <StatCard
          label="Commandes"
          value={stats.orderCount ?? 0}
          icon="📦"
          accent="neutral"
          hint={`${stats.paidOrderCount ?? 0} payée(s)`}
        />
        <StatCard label="Chiffre d'affaires" value={formatPrice(stats.totalRevenue ?? 0)} icon="💰" accent="success" />
      </div>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">Fournisseurs par statut</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatusTile label="En attente" value={sup.pending ?? 0} variant="warning" />
          <StatusTile label="Approuvés" value={sup.approved ?? 0} variant="success" />
          <StatusTile label="Refusés" value={sup.rejected ?? 0} variant="error" />
        </div>
      </Card>
    </div>
  )
}

function StatusTile({ label, value, variant }) {
  const tones = {
    warning: 'bg-warning-50 text-warning-700',
    success: 'bg-success-50 text-success-700',
    error: 'bg-error-50 text-error-700',
  }
  return (
    <div className={cn('rounded-lg px-4 py-3', tones[variant])}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold">{value}</p>
    </div>
  )
}

function SuppliersSection({ suppliers, onUpdated }) {
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  const filtered = filter === 'all' ? suppliers : suppliers.filter((s) => s.status === filter)

  const act = async (supplier, action) => {
    setBusyId(supplier._id)
    setActionError('')
    try {
      const updated =
        action === 'approve'
          ? await adminService.approveSupplier(supplier._id)
          : await adminService.rejectSupplier(supplier._id)
      onUpdated(updated)
    } catch (err) {
      setActionError(err.message || "L'action a échoué.")
    } finally {
      setBusyId(null)
    }
  }

  const FILTERS = [
    { id: 'all', label: 'Tous' },
    { id: 'pending', label: 'En attente' },
    { id: 'approved', label: 'Approuvés' },
    { id: 'rejected', label: 'Refusés' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-navy">Validation des fournisseurs</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                filter === f.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <Alert variant="error" title="Erreur">
          {actionError}
        </Alert>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-muted">Aucun fournisseur pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const meta = SUPPLIER_STATUS[s.status] || SUPPLIER_STATUS.pending
            const busy = busyId === s._id
            return (
              <Card key={s._id} className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold text-navy">{s.companyName}</h3>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  {s.user && (
                    <p className="mt-0.5 text-sm text-muted">
                      {s.user.name} · <span className="font-mono text-xs">{s.user.email}</span>
                    </p>
                  )}
                  {s.description && <p className="mt-1 text-sm text-ink">{s.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    loading={busy}
                    disabled={busy || s.status === 'approved'}
                    onClick={() => act(s, 'approve')}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={busy}
                    disabled={busy || s.status === 'rejected'}
                    onClick={() => act(s, 'reject')}
                  >
                    Refuser
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function UsersSection({ users }) {
  const [role, setRole] = useState('all')
  const filtered = role === 'all' ? users : users.filter((u) => u.role === role)

  const FILTERS = [
    { id: 'all', label: 'Tous' },
    { id: 'client', label: 'Clients' },
    { id: 'supplier', label: 'Fournisseurs' },
    { id: 'admin', label: 'Admins' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-navy">Utilisateurs</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRole(f.id)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                role === f.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANTS[u.role] || 'neutral'}>{ROLE_LABELS[u.role] || u.role}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function OrdersSection({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-muted">Aucune commande.</p>
      </div>
    )
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Commande</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Paiement</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => {
              const status = orderStatus(o.status)
              const method = paymentMethodOf(o.paymentMethod)
              const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'
              return (
                <tr key={o._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-muted">#{o._id.slice(-8)}</td>
                  <td className="px-4 py-3 text-ink">{o.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted">{date}</td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{method.short}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-navy">{formatPrice(o.totalAmount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

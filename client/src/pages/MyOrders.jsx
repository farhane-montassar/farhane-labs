import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '@/services/orderService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import ComponentImage from '@/components/catalogue/ComponentImage'
import { formatPrice } from '@/utils/catalogue'
import { orderStatus, paymentMethodOf } from '@/utils/orders'

/**
 * MyOrders — page /mes-commandes (protégée client). Liste les commandes du client
 * via GET /api/orders/me. Chaque ligne mène au détail /commande/:id.
 */
export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    orderService
      .listMine()
      .then((data) => {
        if (!cancelled) setOrders(data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Impossible de charger vos commandes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Mes commandes</h1>

      {loading ? (
        <div className="flex justify-center py-24 text-primary-600">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-ink">Aucune commande</p>
          <p className="mt-1 text-sm text-muted">Vos achats apparaîtront ici.</p>
          <Button as={Link} to="/catalogue" className="mt-6">
            Voir le catalogue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderRow key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderRow({ order }) {
  const status = orderStatus(order.status)
  const method = paymentMethodOf(order.paymentMethod)
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const itemCount = order.items?.reduce((sum, it) => sum + it.quantity, 0) || 0
  // Vignette : 1er article de la commande (image réelle du composant, repli placeholder).
  const firstItem = order.items?.[0]
  const firstComponent = firstItem?.component || {}

  return (
    <Card as={Link} to={`/commande/${order._id}`} hover className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {firstItem && (
          <ComponentImage
            src={firstComponent.images?.[0]}
            alt={firstItem.name}
            category={firstComponent.category}
            className="h-14 w-14 shrink-0 rounded-md border border-slate-200"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">#{order._id.slice(-8)}</span>
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="neutral">{method.short}</Badge>
          </div>
          {date && <p className="mt-1 text-sm text-ink">Passée le {date}</p>}
          <p className="text-xs text-muted">
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <span className="font-mono text-lg font-bold text-navy">{formatPrice(order.totalAmount)}</span>
    </Card>
  )
}

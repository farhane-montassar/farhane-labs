import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { orderService } from '@/services/orderService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import OrderSummary from '@/components/checkout/OrderSummary'
import { orderStatus, paymentMethodOf, isCancellable, formatTunisianPhone } from '@/utils/orders'

/**
 * OrderDetail — page /commande/:id (protégée client). Sert de page de CONFIRMATION
 * après paiement carte (state.justPaid) ou commande COD (state.justPlaced), et de
 * détail de commande. Permet d'annuler une commande encore annulable.
 */
export default function OrderDetail() {
  const { id } = useParams()
  const location = useLocation()
  const justPaid = location.state?.justPaid
  const justPlaced = location.state?.justPlaced

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    orderService
      .getById(id)
      .then((ord) => {
        if (!cancelled) setOrder(ord)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Commande introuvable.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-primary-600">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
        <Button as={Link} to="/mes-commandes" variant="secondary" className="mt-6">
          ← Mes commandes
        </Button>
      </div>
    )
  }

  const status = orderStatus(order.status)
  const method = paymentMethodOf(order.paymentMethod)
  const isCod = order.paymentMethod === 'cod'
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const addr = order.shippingAddress
  const canCancel = isCancellable(order.status)

  const handleCancel = () => {
    if (!window.confirm('Annuler cette commande ? Le stock réservé sera rétabli.')) return
    setCancelling(true)
    setCancelError('')
    orderService
      .cancel(order._id)
      .then((updated) => {
        setOrder(updated)
        setCancelled(true)
      })
      .catch((err) => setCancelError(err.message || "L'annulation a échoué."))
      .finally(() => setCancelling(false))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Bandeau de succès après paiement carte */}
      {justPaid && (
        <Alert variant="success" title="Paiement réussi 🎉" className="mb-6">
          Merci ! Votre commande a bien été payée et confirmée.
        </Alert>
      )}

      {/* Bandeau de confirmation pour une commande à la livraison */}
      {justPlaced && (
        <Alert variant="success" title="Commande enregistrée 🎉" className="mb-6">
          Merci ! Votre commande est confirmée. Vous réglerez <strong>{method.label.toLowerCase()}</strong> à la
          réception.
        </Alert>
      )}

      {/* Confirmation d'annulation */}
      {cancelled && (
        <Alert variant="success" title="Commande annulée" className="mb-6">
          La commande a été annulée et le stock réservé a été rétabli.
        </Alert>
      )}

      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Commande</h1>
            <p className="mt-0.5 font-mono text-xs text-muted">#{order._id}</p>
            {date && <p className="mt-0.5 text-xs text-muted">Passée le {date}</p>}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="neutral">{method.label}</Badge>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <OrderSummary
            lines={order.items}
            total={order.totalAmount}
            shippingFee={order.shippingFee || 0}
            totalLabel={isCod ? 'Total à payer à la livraison' : 'Total payé'}
          />
        </div>

        {addr && (addr.street || addr.city) && (
          <div className="border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Adresse de livraison</h2>
            <p className="mt-2 text-sm text-ink">
              {addr.street}
              <br />
              {addr.zip} {addr.city}
              <br />
              {addr.country}
            </p>
            {addr.phone && (
              <p className="mt-2 text-sm text-ink">
                <span className="text-muted">Téléphone : </span>
                {formatTunisianPhone(addr.phone)}
              </p>
            )}
          </div>
        )}

        {cancelError && (
          <Alert variant="error" title="Erreur" className="border-t border-slate-100">
            {cancelError}
          </Alert>
        )}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <Button as={Link} to="/mes-commandes" variant="secondary">
            Mes commandes
          </Button>
          <Button as={Link} to="/catalogue" variant="ghost">
            Continuer mes achats
          </Button>
          {canCancel && (
            <Button variant="danger" onClick={handleCancel} loading={cancelling} className="ml-auto">
              Annuler la commande
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

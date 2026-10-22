import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise, isStripeConfigured } from '@/lib/stripe'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { useCart } from '@/hooks/useCart'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import OrderSummary from '@/components/checkout/OrderSummary'
import PaymentForm from '@/components/checkout/PaymentForm'
import EdinarForm from '@/components/checkout/EdinarForm'

/**
 * Payment — page /commande/:id/paiement (protégée client).
 * Charge la commande (récap + total serveur), crée le PaymentIntent, puis affiche
 * le formulaire de carte Stripe. À la réussite : vide le panier et va à la confirmation.
 */
export default function Payment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items: cartItems, clear } = useCart()

  const [order, setOrder] = useState(null)
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // NB : pas de garde `initRef` ici. Sous StrictMode (dev), l'effet est monté
  // deux fois ; combiner une telle garde avec le flag `cancelled` ci-dessous
  // annulerait la SEULE chaîne autorisée à tourner et laisserait `loading` à
  // true (spinner infini). Le flag `cancelled` suffit à ignorer les setState
  // après démontage, et le backend réutilise l'intent existant (idempotent via
  // order.paymentIntentId) : un éventuel double create-intent est sans effet.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    orderService
      .getById(id)
      .then((ord) => {
        if (cancelled) return null
        setOrder(ord)
        // Déjà payée : on saute le paiement.
        if (ord.status === 'paid') return null
        // PaymentIntent Stripe UNIQUEMENT pour la carte. Le paiement e-Dinar est
        // une simulation (pas de Stripe) ; COD est renvoyé au détail plus bas.
        if (ord.paymentMethod !== 'card') return null
        return paymentService.createIntent(id).then((intent) => {
          if (!cancelled) setClientSecret(intent.clientSecret)
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Impossible de préparer le paiement.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const handleSuccess = () => {
    clear()
    navigate(`/commande/${id}`, { state: { justPaid: true } })
  }

  // L'API ne renvoie PAS les images des composants dans une commande
  // (order.repository peuple uniquement name/category/price). Avant paiement, le
  // panier local contient encore l'objet composant complet : on récupère ses
  // images par id de composant pour les afficher dans le récap. (Après paiement
  // le panier est vidé → repli sur le placeholder, ce qui est acceptable.)
  const cartImagesByComponent = new Map(
    cartItems.map(({ component }) => [String(component._id), component.images]),
  )
  const summaryLines = (order?.items || []).map((line) => {
    const componentId = line.component?._id || line.component
    return { ...line, images: line.component?.images || cartImagesByComponent.get(String(componentId)) }
  })

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-primary-600">
        <Spinner size="lg" />
      </div>
    )
  }

  // Commande déjà payée → page de détail/confirmation.
  if (order && order.status === 'paid') {
    return <Navigate to={`/commande/${id}`} replace />
  }

  // Commande à la livraison → aucune page carte ; on renvoie au détail.
  if (order && order.paymentMethod === 'cod') {
    return <Navigate to={`/commande/${id}`} replace />
  }

  // e-Dinar → formulaire simulé (démo) au lieu de Stripe Elements.
  const isEdinar = order?.paymentMethod === 'edinar'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Paiement</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Zone de paiement : carte (Stripe) ou e-Dinar simulé selon la commande. */}
        <div className="lg:col-span-2">
          <Card>
            {isEdinar ? (
              <>
                <h2 className="mb-4 font-display text-lg font-semibold text-navy">
                  Carte tunisienne / e-Dinar
                </h2>
                {error ? (
                  <Alert variant="error" title="Erreur">
                    {error}
                  </Alert>
                ) : (
                  <EdinarForm orderId={id} amount={order?.totalAmount} onSuccess={handleSuccess} />
                )}
              </>
            ) : (
              <>
                <h2 className="mb-4 font-display text-lg font-semibold text-navy">Paiement par carte</h2>

                {!isStripeConfigured ? (
                  <Alert variant="warning" title="Paiement indisponible">
                    La clé publique Stripe n'est pas configurée (VITE_STRIPE_PUBLIC_KEY).
                  </Alert>
                ) : error ? (
                  <Alert variant="error" title="Erreur">
                    {error}
                  </Alert>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      orderId={id}
                      amount={order?.totalAmount}
                      onSuccess={handleSuccess}
                    />
                  </Elements>
                ) : (
                  <div className="flex justify-center py-8 text-primary-600">
                    <Spinner />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Récap commande (total SERVEUR) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <h2 className="mb-2 font-display text-lg font-semibold text-navy">Votre commande</h2>
            {order && (
              <OrderSummary lines={summaryLines} total={order.totalAmount} totalLabel="Total à payer" />
            )}
            <Link to="/panier" className="mt-4 block text-center text-sm text-primary-700 hover:underline">
              Modifier le panier
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

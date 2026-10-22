import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { orderService } from '@/services/orderService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import OrderSummary from '@/components/checkout/OrderSummary'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import { SHIPPING_FEE } from '@/utils/orders'

/**
 * Checkout — page /commande (protégée client). Adresse + méthode de paiement + récap.
 * À la validation : POST /api/orders.
 *  - 'card' → on passe à la page paiement (Stripe). Panier vidé après paiement réussi.
 *  - 'cod'  → commande créée directement (stock réservé, +frais livraison), panier
 *    vidé ici, redirection vers la confirmation (pas de page carte).
 */
export default function Checkout() {
  const { items, totalPrice, clear } = useCart()
  const navigate = useNavigate()

  // `phone` ne contient QUE les 8 chiffres saisis ; l'indicatif +216 est ajouté à
  // l'envoi (et affiché en préfixe fixe devant le champ).
  const [address, setAddress] = useState({ street: '', city: '', zip: '', country: 'Tunisie', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Panier vide : rien à commander → retour au panier.
  if (items.length === 0) {
    return <Navigate to="/panier" replace />
  }

  const isCod = paymentMethod === 'cod'
  // Récap INDICATIF : le total qui fait foi est recalculé côté serveur.
  const shippingFee = isCod ? SHIPPING_FEE : 0
  const displayTotal = totalPrice + shippingFee

  const setField = (field) => (e) => setAddress((a) => ({ ...a, [field]: e.target.value }))
  // Téléphone : on ne garde que les chiffres, limités à 8 (format tunisien).
  const setPhone = (e) => setAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 8) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // Garde-fou côté client (le backend revalide) : 8 chiffres obligatoires.
    if (address.phone.length !== 8) {
      setError('Le téléphone doit comporter exactement 8 chiffres (numéro tunisien).')
      return
    }
    setSubmitting(true)
    setError('')
    orderService
      .create({
        items: items.map(({ component, quantity }) => ({ componentId: component._id, quantity })),
        // On envoie le téléphone COMPLET avec l'indicatif : +216 + 8 chiffres.
        shippingAddress: { ...address, phone: `+216${address.phone}` },
        paymentMethod,
      })
      .then((order) => {
        if (order.paymentMethod === 'cod') {
          // Commande passée : on vide le panier et on va à la confirmation.
          clear()
          navigate(`/commande/${order._id}`, { state: { justPlaced: true } })
        } else {
          // Paiement en ligne (carte Stripe ou e-Dinar simulé) : on enchaîne sur la
          // page de paiement (panier vidé après le paiement réussi).
          navigate(`/commande/${order._id}/paiement`)
        }
      })
      .catch((err) => {
        setError(err.message || 'Impossible de créer la commande.')
        setSubmitting(false)
      })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/panier" className="text-sm font-medium text-primary-700 hover:underline">
        ← Retour au panier
      </Link>
      <h1 className="mt-3 text-3xl font-bold">Commande</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Formulaire d'adresse */}
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <Card className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-navy">Adresse de livraison</h2>

            {error && (
              <Alert variant="error" title="Erreur">
                {error}
              </Alert>
            )}

            <Input label="Rue" value={address.street} onChange={setField('street')} required placeholder="12 rue des Capteurs" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Ville" value={address.city} onChange={setField('city')} required placeholder="Monastir" />
              <Input label="Code postal" value={address.zip} onChange={setField('zip')} required placeholder="5000" />
            </div>
            <Input label="Pays" value={address.country} onChange={setField('country')} required />
            <Input
              label="Téléphone"
              type="tel"
              inputMode="numeric"
              value={address.phone}
              onChange={setPhone}
              required
              leftIcon={<span className="font-medium text-ink">+216</span>}
              className="pl-14"
              placeholder="12 345 678"
              hint="Numéro tunisien à 8 chiffres — le livreur l'utilisera pour vous joindre."
            />

            <div className="border-t border-slate-100 pt-4">
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
            </div>

            <Button type="submit" size="lg" fullWidth loading={submitting}>
              {isCod ? 'Confirmer la commande' : 'Continuer vers le paiement'}
            </Button>
          </Card>
        </form>

        {/* Récap commande */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <h2 className="mb-2 font-display text-lg font-semibold text-navy">Votre commande</h2>
            <OrderSummary
              lines={items}
              total={displayTotal}
              shippingFee={shippingFee}
              totalLabel="Total indicatif"
              note={
                isCod
                  ? 'Frais de livraison inclus. Montant définitif recalculé côté serveur.'
                  : 'Montant définitif recalculé côté serveur.'
              }
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

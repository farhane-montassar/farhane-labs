import { useState } from 'react'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { paymentService } from '@/services/paymentService'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { formatPrice } from '@/utils/catalogue'

/**
 * PaymentForm — saisie carte (Stripe Elements) + paiement réel côté client.
 *
 * Flux :
 *  1. stripe.confirmCardPayment(clientSecret, { payment_method: { card } })
 *     → la carte est confirmée directement auprès de Stripe (jamais via notre serveur).
 *  2. si l'intent passe `succeeded` → paymentService.confirm(orderId) finalise côté
 *     serveur (statut 'paid' + décrément du stock). L'intent étant déjà confirmé,
 *     le backend ne refait PAS de confirmation de test.
 *
 * props : clientSecret, orderId, amount (TND, pour le bouton), onSuccess(paidOrder)
 */
const CARD_OPTIONS = {
  // Pas de demande de code postal : l'adresse est déjà collectée à l'étape commande
  // et le format tunisien (4 chiffres) était rejeté par la validation US de Stripe.
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#0f172a',
      fontFamily: 'inherit',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#dc2626' },
  },
}

export default function PaymentForm({ clientSecret, orderId, amount, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [cardError, setCardError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return // Stripe.js pas encore chargé

    setProcessing(true)
    setError('')

    try {
      // 1. Paiement réel de la carte auprès de Stripe.
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      })

      if (result.error) {
        // Carte refusée, expirée, CVC invalide, etc.
        setError(result.error.message || 'Le paiement a échoué. Vérifiez votre carte.')
        return
      }

      if (result.paymentIntent?.status !== 'succeeded') {
        setError(`Paiement non abouti (statut : ${result.paymentIntent?.status || 'inconnu'}).`)
        return
      }

      // 2. Finalisation serveur (statut 'paid' + stock). L'intent est déjà succeeded.
      const paidOrder = await paymentService.confirm(orderId)
      onSuccess(paidOrder) // navigue (démonte) en cas de succès
    } catch (err) {
      // Soit l'appel Stripe a levé (réseau), soit la finalisation serveur a échoué
      // (paiement peut-être déjà encaissé) : message clair, et on rend la main.
      setError(
        (err.message || 'Une erreur est survenue pendant le paiement.') +
          ' Votre paiement a peut-être abouti — consultez « Mes commandes ».',
      )
    } finally {
      // Remet TOUJOURS le bouton en état (sauf succès, où le composant est démonté).
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" title="Paiement refusé">
          {error}
        </Alert>
      )}

      <div className="rounded-md border border-slate-300 bg-white px-3.5 py-3.5 transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/40">
        <CardElement
          options={CARD_OPTIONS}
          onChange={(e) => setCardError(e.error?.message || '')}
        />
      </div>

      {/* Erreur de saisie carte (numéro/expiration/CVC invalide) remontée par Stripe. */}
      {cardError && <p className="text-sm text-error-600">{cardError}</p>}

      {/* Le bouton ne dépend PLUS de `cardReady` : Stripe valide la complétude de la
          carte à la soumission (confirmCardPayment renvoie une erreur claire si elle
          est incomplète). On garde uniquement les vrais prérequis : Stripe.js chargé
          et aucun paiement déjà en cours. Évite tout grisage permanent du bouton. */}
      <Button type="submit" size="lg" fullWidth loading={processing} disabled={!stripe || !elements || processing}>
        Payer {formatPrice(amount)}
      </Button>

      <p className="text-center text-xs text-muted">
        Paiement sécurisé par Stripe. Vos informations de carte ne transitent jamais par nos serveurs.
      </p>
    </form>
  )
}

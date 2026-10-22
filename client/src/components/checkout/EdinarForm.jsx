import { useState } from 'react'
import { paymentService } from '@/services/paymentService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { formatPrice } from '@/utils/catalogue'

/**
 * EdinarForm — formulaire de paiement « Carte tunisienne / e-Dinar » SIMULÉ (démo).
 *
 * ⚠️ DÉMONSTRATION ASSUMÉE : il n'y a AUCUNE intégration bancaire réelle (SMT /
 * ClicToPay). On valide uniquement le FORMAT des champs côté client, puis on
 * finalise la commande côté serveur. Le numéro de carte saisi n'est JAMAIS envoyé
 * ni stocké : seul l'orderId part vers /api/payment/simulate-edinar.
 *
 * props : orderId, amount (TND, pour le bouton), onSuccess(paidOrder)
 */

// Validation de FORMAT (pas de vérification bancaire).
function validate({ number, expiry, cvv }) {
  const errors = {}

  const digits = number.replace(/\s/g, '')
  if (!/^\d{16}$/.test(digits)) {
    errors.number = 'Le numéro de carte doit comporter 16 chiffres.'
  }

  const m = expiry.match(/^(\d{2})\/(\d{2})$/)
  if (!m) {
    errors.expiry = "Format attendu : MM/AA (ex. 12/30)."
  } else {
    const month = Number(m[1])
    const year = 2000 + Number(m[2])
    if (month < 1 || month > 12) {
      errors.expiry = 'Mois invalide (01 à 12).'
    } else {
      // Carte expirée : on compare à la fin du mois d'expiration.
      const now = new Date()
      const endOfExpiry = new Date(year, month, 0, 23, 59, 59)
      if (endOfExpiry < now) errors.expiry = 'Carte expirée.'
    }
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    errors.cvv = 'Le code de sécurité (CVV) doit comporter 3 ou 4 chiffres.'
  }

  return errors
}

// Formatage de saisie : groupes de 4 chiffres, max 16.
function formatCardNumber(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

// Formatage de saisie : MM/AA automatique.
function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export default function EdinarForm({ orderId, amount, onSuccess }) {
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 1. Validation de FORMAT locale (jamais de vérif bancaire).
    const formErrors = validate({ number, expiry, cvv })
    setErrors(formErrors)
    if (Object.keys(formErrors).length > 0) return

    // 2. Finalisation serveur : on n'envoie QUE l'orderId (aucune donnée de carte).
    setProcessing(true)
    setError('')
    try {
      const paidOrder = await paymentService.simulateEdinar(orderId)
      onSuccess(paidOrder) // navigue (démonte) en cas de succès
    } catch (err) {
      setError(err.message || 'La simulation de paiement a échoué. Réessayez.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bandeau de démonstration — clairement assumé, pas d'imitation de banque. */}
      <Alert variant="warning" title="Paiement e-Dinar simulé">
        Ceci est un paiement de <strong>démonstration</strong> à des fins de test : aucun débit réel
        n'est effectué et aucune donnée de carte n'est transmise. Saisissez un numéro fictif
        (ex. 4000 0000 0000 0000).
      </Alert>

      {error && (
        <Alert variant="error" title="Paiement refusé">
          {error}
        </Alert>
      )}

      <Input
        label="Numéro de carte"
        inputMode="numeric"
        autoComplete="off"
        placeholder="4000 0000 0000 0000"
        value={number}
        onChange={(e) => setNumber(formatCardNumber(e.target.value))}
        error={errors.number}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Expiration (MM/AA)"
          inputMode="numeric"
          autoComplete="off"
          placeholder="12/30"
          value={expiry}
          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          error={errors.expiry}
        />
        <Input
          label="CVV"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123"
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
          error={errors.cvv}
        />
      </div>

      <Button type="submit" size="lg" fullWidth loading={processing} disabled={processing}>
        Payer {formatPrice(amount)}
      </Button>

      <p className="text-center text-xs text-muted">
        Démonstration — le numéro de carte reste sur votre appareil et n'est jamais envoyé à nos serveurs.
      </p>
    </form>
  )
}

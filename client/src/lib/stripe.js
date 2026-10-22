import { loadStripe } from '@stripe/stripe-js'

/**
 * Client Stripe.js (singleton). Initialisé avec la clé PUBLIQUE de test.
 * Si la clé est absente, `stripePromise` est null : l'UI de paiement affichera
 * un message clair plutôt que de planter.
 */
const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY

export const stripePromise = key ? loadStripe(key) : null
export const isStripeConfigured = Boolean(key)

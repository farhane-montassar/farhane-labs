// Libellés FR + variante de Badge par statut de commande (aligné sur l'enum backend).
export const ORDER_STATUS = {
  pending: { variant: 'warning', label: 'En attente de paiement' },
  pending_cod: { variant: 'warning', label: 'En attente — paiement à la livraison' },
  paid: { variant: 'success', label: 'Payée' },
  shipped: { variant: 'primary', label: 'Expédiée' },
  delivered: { variant: 'success', label: 'Livrée' },
  cancelled: { variant: 'error', label: 'Annulée' },
}

export const orderStatus = (s) => ORDER_STATUS[s] || ORDER_STATUS.pending

// Méthodes de paiement. Les anciennes commandes sans paymentMethod → 'card'.
export const PAYMENT_METHOD = {
  card: { label: 'Carte bancaire', short: 'Carte' },
  cod: { label: 'Paiement à la livraison', short: 'À la livraison' },
  edinar: { label: 'Carte tunisienne / e-Dinar', short: 'e-Dinar' },
}

export const paymentMethodOf = (m) => PAYMENT_METHOD[m] || PAYMENT_METHOD.card

// Frais de livraison (paiement à la livraison uniquement). Valeur INDICATIVE côté
// front : le montant qui fait foi est recalculé côté serveur (order.service).
export const SHIPPING_FEE = 3

// Statuts encore annulables côté client (cohérent avec le service : ni expédiée,
// ni livrée, ni déjà annulée).
export const CANCELLABLE_STATUSES = ['pending', 'pending_cod', 'paid']
export const isCancellable = (s) => CANCELLABLE_STATUSES.includes(s)

// Téléphone livraison : stocké en compact « +216XXXXXXXX ». Affichage lisible
// « +216 XX XXX XXX ». Tolérant : renvoie la valeur brute si le format diffère.
export function formatTunisianPhone(phone) {
  if (!phone) return ''
  const m = String(phone).match(/^\+216(\d{8})$/)
  if (!m) return phone
  const d = m[1]
  return `+216 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
}

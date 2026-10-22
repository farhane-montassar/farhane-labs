// Libellés + variantes de Badge pour le statut d'une demande de composant.
// Partagé entre l'espace client (Mes demandes) et le dashboard fournisseur.
export const REQUEST_STATUS = {
  pending: { label: 'En attente', variant: 'warning' },
  fulfilled: { label: 'Satisfaite', variant: 'success' },
  closed: { label: 'Clôturée', variant: 'neutral' },
}

export function requestStatus(status) {
  return REQUEST_STATUS[status] || REQUEST_STATUS.pending
}

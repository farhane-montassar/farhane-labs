// Helpers et libellés partagés par le catalogue et la fiche produit.

// Libellés FR + variante de Badge par catégorie backend.
export const CATEGORIES = {
  board: { label: 'Carte', variant: 'primary' },
  sensor: { label: 'Capteur', variant: 'accent' },
  module: { label: 'Module', variant: 'success' },
  accessory: { label: 'Accessoire', variant: 'neutral' },
  display: { label: 'Afficheur', variant: 'primary' },
  motor: { label: 'Moteur', variant: 'warning' },
  power: { label: 'Alimentation', variant: 'error' },
}

export const categoryLabel = (c) => CATEGORIES[c]?.label || c
export const categoryVariant = (c) => CATEGORIES[c]?.variant || 'neutral'

// Options du select de tri (value = query param `sort` du backend, '' = pertinence/défaut).
export const SORT_OPTIONS = [
  { value: '', label: 'Pertinence' },
  { value: 'price', label: 'Prix croissant' },
  { value: '-price', label: 'Prix décroissant' },
  { value: '-createdAt', label: 'Plus récent' },
]

// Seuil de stock faible (cohérent avec l'alerte dashboard fournisseur du backend).
export const LOW_STOCK = 5

// Statut de stock -> { label, variant } pour un Badge.
export function stockStatus(stock) {
  if (stock <= 0) return { label: 'Rupture', variant: 'error' }
  if (stock <= LOW_STOCK) return { label: `Stock faible (${stock})`, variant: 'warning' }
  return { label: `En stock (${stock})`, variant: 'success' }
}

// Formatage prix en TND (le backend stocke des nombres bruts).
// Nombre simple formaté fr-FR + suffixe « TND » (ex. « 45 TND »).
export function formatPrice(value) {
  return `${new Intl.NumberFormat('fr-FR').format(value ?? 0)} TND`
}

// Formatage tension à partir des specs : « 5V » si valeur unique, « 3.3-5V » si plage.
// Retombe sur specs.voltage si min/max absents ; renvoie null si rien n'est renseigné.
export function formatVoltage(specs = {}) {
  const min = specs.voltageMin ?? specs.voltage
  const max = specs.voltageMax ?? specs.voltage
  if (min == null && max == null) return null
  const lo = min ?? max
  const hi = max ?? min
  return lo === hi ? `${lo}V` : `${lo}-${hi}V`
}

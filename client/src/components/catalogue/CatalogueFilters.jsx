import { useEffect, useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CATEGORIES, SORT_OPTIONS } from '@/utils/catalogue'

/**
 * CatalogueFilters — barre de filtres branchée sur les query params de l'API.
 * Ne filtre RIEN côté JS : remonte chaque changement au parent via onChange,
 * qui synchronise l'URL puis relance la requête backend.
 *
 * props :
 *  - filters : { search, category, voltage, minPrice, maxPrice, sort }
 *  - onChange(partial) : applique une mise à jour partielle des filtres
 *  - onReset() : réinitialise tous les filtres
 *
 * Les champs texte (recherche, prix) sont debouncés pour ne pas requêter à chaque frappe.
 */
const VOLTAGES = [
  { value: '', label: 'Toutes tensions' },
  { value: '3.3', label: '3.3 V' },
  { value: '5', label: '5 V' },
]

export default function CatalogueFilters({ filters, onChange, onReset }) {
  // État local des champs texte (debounce) — initialisé depuis l'URL.
  const [search, setSearch] = useState(filters.search || '')
  const [minPrice, setMinPrice] = useState(filters.minPrice || '')
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '')

  // Resynchronise les champs locaux si l'URL change de l'extérieur (ex: reset).
  useEffect(() => {
    setSearch(filters.search || '')
    setMinPrice(filters.minPrice || '')
    setMaxPrice(filters.maxPrice || '')
  }, [filters.search, filters.minPrice, filters.maxPrice])

  // Debounce de la recherche.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.search || '') !== search) onChange({ search })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Debounce de la fourchette de prix.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.minPrice || '') !== minPrice || (filters.maxPrice || '') !== maxPrice) {
        onChange({ minPrice, maxPrice })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice])

  const hasActive =
    filters.search || filters.category || filters.voltage || filters.minPrice || filters.maxPrice || filters.sort

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      {/* Recherche */}
      <Input
        type="search"
        placeholder="Rechercher un composant…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" strokeLinecap="round" />
          </svg>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Catégorie */}
        <Select
          label="Catégorie"
          value={filters.category || ''}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">Toutes</option>
          {Object.entries(CATEGORIES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        {/* Tension */}
        <Select
          label="Tension"
          value={filters.voltage || ''}
          onChange={(e) => onChange({ voltage: e.target.value })}
        >
          {VOLTAGES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </Select>

        {/* Prix */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Prix (TND)</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              placeholder="min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-muted">–</span>
            <Input
              type="number"
              min="0"
              placeholder="max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Tri */}
        <Select label="Trier par" value={filters.sort || ''} onChange={(e) => onChange({ sort: e.target.value })}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {hasActive && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  )
}

// Petit select stylé cohérent avec l'Input du design system.
function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-ink transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

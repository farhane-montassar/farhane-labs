import { useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import ComponentImage from '@/components/catalogue/ComponentImage'
import {
  CATEGORIES,
  categoryLabel,
  categoryVariant,
  formatPrice,
  formatVoltage,
} from '@/utils/catalogue'

/**
 * ComponentPicker — étape 2 : ajout de composants à la configuration.
 *
 * Filtrage recherche/catégorie en mémoire sur la liste DÉJÀ chargée depuis le
 * backend (affichage uniquement ; la compatibilité reste validée côté serveur).
 *
 * props :
 *  - components : composants ajoutables (non-board)
 *  - addedIds   : Set des ids déjà dans la config (pour l'état du bouton)
 *  - onAdd(component)
 */
// Catégories proposées au filtre : toutes sauf 'board'.
const PICKER_CATEGORIES = Object.entries(CATEGORIES).filter(([value]) => value !== 'board')

export default function ComponentPicker({ components, addedIds, onAdd }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return components.filter((c) => {
      if (category && c.category !== category) return false
      if (q && !c.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [components, search, category])

  return (
    <section>
      <StepTitle n={2} title="Ajoutez des composants" />

      {/* Filtres */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-ink transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 sm:w-48"
        >
          <option value="">Toutes catégories</option>
          {PICKER_CATEGORIES.map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-muted">
          Aucun composant ne correspond à votre recherche.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const added = addedIds.has(c._id)
            const voltage = formatVoltage(c.specs)
            return (
              <Card key={c._id} padded={false} className="flex flex-col overflow-hidden">
                <ComponentImage src={c.images?.[0]} alt={c.name} category={c.category} className="aspect-[4/3]" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={categoryVariant(c.category)}>{categoryLabel(c.category)}</Badge>
                    {voltage && <span className="font-mono text-xs text-muted">{voltage}</span>}
                  </div>
                  <h3 className="font-display text-sm font-semibold leading-snug text-navy">{c.name}</h3>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-mono text-base font-semibold text-navy">{formatPrice(c.price)}</span>
                    <Button
                      size="sm"
                      variant={added ? 'secondary' : 'primary'}
                      onClick={() => onAdd(c)}
                    >
                      {added ? '✓ Ajouté' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

function StepTitle({ n, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">
        {n}
      </span>
      <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
    </div>
  )
}

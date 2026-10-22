import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ComponentImage from '@/components/catalogue/ComponentImage'
import { formatPrice } from '@/utils/catalogue'

/**
 * BoardSelector — étape 1 du configurateur : choix de la carte de base.
 *
 * - Aucune carte choisie  → grille des cartes (category 'board') à sélectionner.
 * - Carte choisie         → résumé compact (image, tensions, broches, bus) + « Changer ».
 *
 * props :
 *  - boards   : cartes disponibles (déjà chargées depuis le backend)
 *  - selected : carte sélectionnée (objet) ou null
 *  - onSelect(board) / onChange() : sélectionne / réinitialise la carte
 */
export default function BoardSelector({ boards, selected, onSelect, onChange }) {
  if (selected) {
    return <SelectedBoard board={selected} onChange={onChange} />
  }

  return (
    <section>
      <StepTitle n={1} title="Choisissez votre carte de base" />
      {boards.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Aucune carte disponible pour le moment.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <Card
              key={b._id}
              hover
              padded={false}
              as="button"
              onClick={() => onSelect(b)}
              className="group flex flex-col overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            >
              <ComponentImage src={b.images?.[0]} alt={b.name} category={b.category} className="aspect-[4/3]" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-display text-base font-semibold text-navy group-hover:text-primary-700">{b.name}</h3>
                <BoardCaps caps={b.boardCapabilities} />
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-mono text-base font-semibold text-navy">{formatPrice(b.price)}</span>
                  <Badge variant="primary">Choisir</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

/* Carte sélectionnée — résumé compact en tête de page. */
function SelectedBoard({ board, onChange }) {
  const caps = board.boardCapabilities || {}
  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ComponentImage
        src={board.images?.[0]}
        alt={board.name}
        category={board.category}
        className="h-28 w-full shrink-0 rounded-lg border border-slate-200 sm:w-40"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="primary">Carte de base</Badge>
          <span className="font-mono text-sm font-semibold text-navy">{formatPrice(board.price)}</span>
        </div>
        <h3 className="mt-1.5 font-display text-lg font-semibold text-navy">{board.name}</h3>
        <BoardCaps caps={caps} className="mt-2" />
      </div>
      <Button variant="secondary" size="sm" onClick={onChange} className="shrink-0">
        Changer de carte
      </Button>
    </Card>
  )
}

/* Tensions / broches / bus d'une carte, en petites pastilles. */
function BoardCaps({ caps = {}, className }) {
  const items = [
    caps.voltagesSupported?.length ? `${caps.voltagesSupported.join(' / ')} V` : null,
    caps.digitalPins != null || caps.analogPins != null
      ? `${(caps.digitalPins || 0) + (caps.analogPins || 0)} broches`
      : null,
    caps.buses?.length ? caps.buses.join(', ') : null,
  ].filter(Boolean)

  if (items.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className || ''}`}>
      {items.map((it) => (
        <li key={it} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {it}
        </li>
      ))}
    </ul>
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

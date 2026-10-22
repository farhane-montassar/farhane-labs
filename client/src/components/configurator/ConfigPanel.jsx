import Card from '@/components/ui/Card'
import ComponentImage from '@/components/catalogue/ComponentImage'
import { categoryLabel, formatPrice } from '@/utils/catalogue'
import QuantityStepper from './QuantityStepper'

/**
 * ConfigPanel — « Ma configuration » : liste des composants ajoutés, avec
 * quantité modifiable (+/-) et retrait. N'affiche PAS le verdict (cf. ValidationResult).
 *
 * props :
 *  - items : [{ component, quantity }]
 *  - onInc(id) / onDec(id) / onRemove(id) / onClear()
 */
export default function ConfigPanel({ items, onInc, onDec, onRemove, onClear }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-navy">Ma configuration</h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-error-600 transition-colors hover:text-error-700"
          >
            Tout retirer
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-muted">
          Aucun composant ajouté. Sélectionnez des composants à monter sur votre carte.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {items.map(({ component, quantity }) => (
            <li key={component._id} className="flex items-center gap-3 py-3">
              <ComponentImage
                src={component.images?.[0]}
                alt={component.name}
                category={component.category}
                className="h-12 w-12 shrink-0 rounded-md border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{component.name}</p>
                <p className="text-xs text-muted">
                  {categoryLabel(component.category)} · {formatPrice(component.price)}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <QuantityStepper
                    value={quantity}
                    onDec={() => onDec(component._id)}
                    onInc={() => onInc(component._id)}
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(component._id)}
                    className="text-xs font-medium text-muted transition-colors hover:text-error-600"
                  >
                    Retirer
                  </button>
                </div>
              </div>
              <span className="shrink-0 self-start font-mono text-sm font-semibold text-navy">
                {formatPrice(component.price * quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

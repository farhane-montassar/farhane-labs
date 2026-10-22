import Badge from '@/components/ui/Badge'
import ComponentImage from '@/components/catalogue/ComponentImage'
import { categoryLabel, formatPrice } from '@/utils/catalogue'

/**
 * OrderSummary — récap d'articles réutilisable (panier, commande, confirmation).
 *
 * props :
 *  - lines : [{ component?, name?, category?, price?, quantity, images? }]
 *      Accepte aussi bien un item de panier ({ component, quantity }) qu'un item
 *      de commande backend ({ name, price, quantity, component:{category,...} }).
 *  - total : montant à afficher (TND). Indicatif côté panier, serveur ailleurs.
 *  - totalLabel : libellé du total (défaut « Total »).
 *  - note : petit texte sous le total (ex. « total recalculé à la commande »).
 *  - shippingFee : frais de livraison (> 0 → affiche une ligne « Livraison »).
 */
export default function OrderSummary({ lines = [], total, totalLabel = 'Total', note, shippingFee = 0 }) {
  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {lines.map((line, i) => {
          const c = line.component || {}
          const name = line.name || c.name || 'Composant'
          const category = c.category || line.category
          const price = line.price != null ? line.price : c.price
          const images = c.images || line.images
          return (
            <li key={c._id || line._id || i} className="flex items-center gap-3 py-3">
              <ComponentImage
                src={images?.[0]}
                alt={name}
                category={category}
                className="h-12 w-12 shrink-0 rounded-md border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  {category && <Badge variant="neutral">{categoryLabel(category)}</Badge>}
                  <span>
                    {formatPrice(price)} × {line.quantity}
                  </span>
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold text-navy">
                {formatPrice((price || 0) * line.quantity)}
              </span>
            </li>
          )
        })}
      </ul>

      {total != null && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          {shippingFee > 0 && (
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>Livraison</span>
              <span className="font-mono text-ink">{formatPrice(shippingFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">{totalLabel}</span>
            <span className="font-mono text-xl font-bold text-navy">{formatPrice(total)}</span>
          </div>
          {note && <p className="mt-1 text-xs text-muted">{note}</p>}
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ComponentImage from './ComponentImage'
import Stars from './Stars'
import { useCart } from '@/hooks/useCart'
import { categoryLabel, categoryVariant, stockStatus, formatPrice } from '@/utils/catalogue'

/**
 * ProductCard — carte produit du catalogue. Toute la carte est cliquable
 * et mène à la fiche /components/:id.
 *
 * props : component (objet renvoyé par GET /api/components -> items[])
 */
export default function ProductCard({ component }) {
  const { _id, name, category, price, stock, images, supplier, ratingAverage, ratingCount } = component
  const stockInfo = stockStatus(stock)
  const { addItem } = useCart()
  const outOfStock = stock <= 0

  // La carte entière est un <Link> : on empêche la navigation au clic du bouton.
  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(component, 1)
  }

  return (
    <Card
      as={Link}
      to={`/components/${_id}`}
      hover
      padded={false}
      className="group flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
    >
      <ComponentImage
        src={images?.[0]}
        alt={name}
        category={category}
        className="aspect-square"
      />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={categoryVariant(category)}>{categoryLabel(category)}</Badge>
          <Badge variant={stockInfo.variant}>{stockInfo.label}</Badge>
        </div>

        <h3 className="font-display text-base font-semibold leading-snug text-navy transition-colors group-hover:text-primary-700">
          {name}
        </h3>

        <Stars average={ratingAverage} count={ratingCount} />

        {supplier?.companyName && (
          <p className="text-xs text-muted">
            par <span className="font-medium text-ink">{supplier.companyName}</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-mono text-lg font-semibold text-navy">{formatPrice(price)}</span>
          <Button size="sm" onClick={handleAdd} disabled={outOfStock}>
            {outOfStock ? 'Rupture' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

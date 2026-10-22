import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ComponentImage from '@/components/catalogue/ComponentImage'
import QuantityStepper from '@/components/configurator/QuantityStepper'
import { categoryLabel, formatPrice } from '@/utils/catalogue'

/**
 * Cart — page /panier. Liste éditable des articles + total INDICATIF.
 * « Passer commande » mène à /commande (route protégée client : redirige vers
 * login si besoin). Le total qui fait foi est recalculé par le backend.
 */
export default function Cart() {
  const { items, updateQuantity, removeItem, clear, totalItems, totalPrice } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Mon panier</h1>
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-ink">Votre panier est vide</p>
          <p className="mt-1 text-sm text-muted">Parcourez le catalogue pour ajouter des composants.</p>
          <Button as={Link} to="/catalogue" className="mt-6">
            Voir le catalogue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mon panier</h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm font-medium text-error-600 transition-colors hover:text-error-700"
        >
          Vider le panier
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Liste des articles */}
        <div className="space-y-4 lg:col-span-2">
          {items.map(({ component, quantity }) => (
            <Card key={component._id} className="flex items-center gap-4">
              <Link to={`/components/${component._id}`} className="shrink-0">
                <ComponentImage
                  src={component.images?.[0]}
                  alt={component.name}
                  category={component.category}
                  className="h-20 w-20 rounded-lg border border-slate-200"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/components/${component._id}`}
                  className="font-display font-semibold text-navy hover:text-primary-700"
                >
                  {component.name}
                </Link>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <Badge variant="neutral">{categoryLabel(component.category)}</Badge>
                  <span>{formatPrice(component.price)} / unité</span>
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <QuantityStepper
                    value={quantity}
                    onDec={() => updateQuantity(component._id, quantity - 1)}
                    onInc={() => updateQuantity(component._id, quantity + 1)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(component._id)}
                    className="text-xs font-medium text-muted transition-colors hover:text-error-600"
                  >
                    Retirer
                  </button>
                </div>
              </div>

              <span className="shrink-0 self-start font-mono text-base font-semibold text-navy">
                {formatPrice(component.price * quantity)}
              </span>
            </Card>
          ))}
        </div>

        {/* Récap + commande */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-navy">Récapitulatif</h2>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Articles</span>
              <span className="font-medium text-ink">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-medium text-muted">Total indicatif</span>
              <span className="font-mono text-xl font-bold text-navy">{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-xs text-muted">
              Le montant définitif est recalculé de façon sécurisée à la création de la commande.
            </p>
            <Button fullWidth size="lg" onClick={() => navigate('/commande')}>
              Passer commande
            </Button>
            <Button as={Link} to="/catalogue" variant="ghost" fullWidth>
              Continuer mes achats
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

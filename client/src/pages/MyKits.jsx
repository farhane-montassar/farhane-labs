import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { kitService } from '@/services/kitService'
import { useCart } from '@/hooks/useCart'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { categoryLabel, formatPrice } from '@/utils/catalogue'
import { addKitToCart } from '@/utils/cart'

/**
 * MyKits — page /mes-kits (rôle client). Liste les configurations sauvegardées
 * via GET /api/kits. Les composants peuplés ne portent que name/category/price
 * (pas d'images) : on présente un récap texte compact.
 */
const STATUS = {
  compatible: { variant: 'success', label: 'Compatible' },
  compatible_adaptation: { variant: 'warning', label: 'Compatible avec adaptation' },
  incompatible: { variant: 'error', label: 'Incompatible' },
  // Alias rétrocompatible : ancien statut « warning » → adaptation.
  warning: { variant: 'warning', label: 'Compatible avec adaptation' },
}

export default function MyKits() {
  const [kits, setKits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    kitService
      .listMine()
      .then((data) => {
        if (!cancelled) setKits(data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Impossible de charger vos kits.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes kits</h1>
          <p className="mt-1 text-muted">Vos configurations sauvegardées.</p>
        </div>
        <Button as={Link} to="/configurateur" variant="secondary" size="sm">
          + Nouvelle configuration
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center py-24 text-primary-600">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      ) : kits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-ink">Aucun kit sauvegardé</p>
          <p className="mt-1 text-sm text-muted">Composez une configuration et sauvegardez-la pour la retrouver ici.</p>
          <Button as={Link} to="/configurateur" className="mt-6">
            Ouvrir le configurateur
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {kits.map((kit) => (
            <KitCard key={kit._id} kit={kit} />
          ))}
        </div>
      )}
    </div>
  )
}

function KitCard({ kit }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const s = STATUS[kit.compatibilityStatus] || STATUS.compatible_adaptation
  // Seul un kit incompatible (blocage physique) ne peut pas être commandé ;
  // une adaptation reste commandable (l'utilisateur ajoutera l'élément requis).
  const canOrder = kit.compatibilityStatus !== 'incompatible'
  const date = kit.createdAt
    ? new Date(kit.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const handleOrder = () => {
    addKitToCart(addItem, kit.board, kit.components)
    setAdded(true)
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-navy">{kit.name}</h2>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
          {date && <p className="mt-0.5 text-xs text-muted">Créé le {date}</p>}
        </div>
        <span className="font-mono text-xl font-bold text-navy">{formatPrice(kit.totalPrice)}</span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        {/* Carte de base */}
        {kit.board && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="primary">Carte</Badge>
            <span className="font-medium text-ink">{kit.board.name}</span>
          </div>
        )}

        {/* Composants */}
        {kit.components?.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {kit.components.map((line) => (
              <li key={line._id || line.component?._id} className="flex items-center gap-2 text-sm">
                {line.component?.category && (
                  <Badge variant="neutral">{categoryLabel(line.component.category)}</Badge>
                )}
                <span className="text-ink">{line.component?.name || 'Composant'}</span>
                {line.quantity > 1 && <span className="font-mono text-xs text-muted">× {line.quantity}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Commander : tout kit non incompatible (compatible ou adaptation). */}
      {canOrder && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {added ? (
            <Alert variant="success" title="Ajouté au panier 🛒">
              La carte et les composants de ce kit sont dans votre panier.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button as={Link} to="/panier" size="sm">
                  Voir le panier
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setAdded(false)}>
                  Annuler l'aperçu
                </Button>
              </div>
            </Alert>
          ) : (
            <Button onClick={handleOrder} variant="secondary" size="sm">
              Commander ce kit
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

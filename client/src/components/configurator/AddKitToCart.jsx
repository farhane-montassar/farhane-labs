import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { addKitToCart } from '@/utils/cart'

/**
 * AddKitToCart — commande de la configuration courante : ajoute la carte + tous les
 * composants au panier existant, puis renvoie au tunnel d'achat.
 *
 * Règle métier : seul `incompatible` (blocage physique) interdit la commande.
 * `compatible` et `compatible_adaptation` sont commandables (l'utilisateur ajoutera
 * l'élément requis par l'adaptation). Rendu seulement quand une validation a renvoyé
 * un statut (même condition que SaveKitForm).
 *
 * props : board, items ([{ component, quantity }]), status
 *         ('compatible'|'compatible_adaptation'|'incompatible')
 */
export default function AddKitToCart({ board, items, status }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  // Pas de validation → rien (cohérent avec ValidationResult/SaveKitForm).
  if (!status) return null

  // Alias rétrocompatible : ancien statut « warning » → adaptation.
  const isAdaptation = status === 'compatible_adaptation' || status === 'warning'
  const canOrder = status !== 'incompatible'

  const handleAdd = () => {
    addKitToCart(addItem, board, items)
    setAdded(true)
  }

  // Confirmation après ajout.
  if (added) {
    return (
      <Card>
        <Alert variant="success" title="Kit ajouté au panier 🛒">
          La carte et tous les composants ont été ajoutés à votre panier.
          <div className="mt-3 flex flex-wrap gap-2">
            <Button as={Link} to="/panier" size="sm">
              Voir le panier
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAdded(false)}>
              Continuer la configuration
            </Button>
          </div>
        </Alert>
      </Card>
    )
  }

  return (
    <Card className="space-y-2">
      <Button fullWidth onClick={handleAdd} disabled={!canOrder}>
        Ajouter ce kit au panier
      </Button>
      {!canOrder ? (
        <p className="text-center text-xs text-muted">
          Résolvez les incompatibilités avant de commander.
        </p>
      ) : isAdaptation ? (
        <p className="text-center text-xs text-muted">
          Commandable : pensez à ajouter l'élément d'adaptation recommandé ci-dessus.
        </p>
      ) : null}
    </Card>
  )
}

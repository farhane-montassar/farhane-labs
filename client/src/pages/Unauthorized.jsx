import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

/** Page 403 — affichée quand un rôle requis n'est pas satisfait. */
export default function Unauthorized() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="text-5xl">🚫</span>
      <h1 className="mt-4 text-3xl font-bold">Accès refusé</h1>
      <p className="mt-2 text-muted">
        Vous n'avez pas les privilèges nécessaires pour accéder à cette page.
      </p>
      <Button as={Link} to="/" className="mt-6">
        Retour à l'accueil
      </Button>
    </div>
  )
}

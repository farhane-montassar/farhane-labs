import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

/** Page 404 — route inconnue. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="font-display text-6xl font-bold text-primary-600">404</span>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-muted">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Button as={Link} to="/" className="mt-6">
        Retour à l'accueil
      </Button>
    </div>
  )
}

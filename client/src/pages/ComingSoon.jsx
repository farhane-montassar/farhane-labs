import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

/**
 * ComingSoon — placeholder pour les sections pas encore développées
 * (catalogue, configurateur…). Évite les liens morts dans la navbar.
 */
export default function ComingSoon({ title = 'Bientôt disponible' }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <Badge variant="accent">🚧 En construction</Badge>
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted">
        Cette section sera développée dans une prochaine étape du projet.
      </p>
      <Button as={Link} to="/" variant="secondary" className="mt-6">
        Retour à l'accueil
      </Button>
    </div>
  )
}

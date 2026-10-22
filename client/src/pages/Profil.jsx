import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

const ROLE_LABELS = { client: 'Client', supplier: 'Fournisseur', admin: 'Admin' }

/**
 * Profil — page protégée minimale. Sert surtout à démontrer que l'auth
 * fonctionne (route protégée + données /auth/me). Sera enrichie plus tard.
 */
export default function Profil() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Mon profil</h1>
      <p className="mt-1 text-muted">Vos informations de compte.</p>

      <Card className="mt-6">
        <dl className="divide-y divide-slate-100">
          <Row label="Nom">{user.name}</Row>
          <Row label="Email"><span className="font-mono text-sm">{user.email}</span></Row>
          <Row label="Rôle">
            <Badge variant="primary">{ROLE_LABELS[user.role] || user.role}</Badge>
          </Row>
          <Row label="Identifiant"><span className="font-mono text-xs text-muted">{user.id}</span></Row>
        </dl>
      </Card>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-4">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  )
}

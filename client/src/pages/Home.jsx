import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

/**
 * Home — landing de départ. Hero + 3 points forts + bandeau configurateur.
 * (Le catalogue/configurateur réels arriveront dans les prochaines sessions.)
 */
const FEATURES = [
  {
    icon: '🧩',
    title: 'Configurateur intelligent',
    text: 'Composez votre kit : tension, bus (I2C/SPI/UART) et broches vérifiés automatiquement.',
  },
  {
    icon: '🏪',
    title: 'Marketplace multi-fournisseurs',
    text: 'Des composants proposés par plusieurs fournisseurs, sur une plateforme unique.',
  },
  {
    icon: '🔒',
    title: 'Paiement sécurisé',
    text: 'Commandez et payez en ligne en toute confiance (Stripe, mode test).',
  },
]

export default function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-navy">
        {/* halo décoratif */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <Badge variant="accent" className="mb-5 bg-accent-500/10 text-accent-300 ring-accent-500/30">
              ⚡ Marketplace de composants électroniques
            </Badge>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Concevez des montages <span className="text-accent-400">compatibles</span>, du premier coup.
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              Arduino, ESP32, capteurs et modules — Farhane Labs vérifie la compatibilité
              technique de vos composants et vous guide jusqu'à la commande.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/catalogue" size="lg">
                Explorer le catalogue
              </Button>
              {!isAuthenticated ? (
                <Button as={Link} to="/register" size="lg" variant="secondary">
                  Créer un compte
                </Button>
              ) : (
                <span className="self-center text-sm text-slate-400">
                  Bon retour, <span className="font-semibold text-white">{user.name}</span> 👋
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} hover>
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- CTA configurateur ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-10 text-center shadow-elevated sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white">Prêt à monter votre kit ?</h2>
            <p className="mt-1 text-primary-50">
              Lancez le configurateur et obtenez un retour de compatibilité en temps réel.
            </p>
          </div>
          <Button as={Link} to="/configurateur" size="lg" variant="secondary" className="shrink-0">
            Ouvrir le configurateur
          </Button>
        </div>
      </section>
    </>
  )
}

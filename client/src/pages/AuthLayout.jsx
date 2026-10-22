import Logo from '@/components/Logo'
import Card from '@/components/ui/Card'

/**
 * AuthLayout — gabarit partagé des pages Login / Register.
 * Split en deux : panneau de marque (gauche, fond navy) + formulaire (droite).
 * Sur mobile, seul le formulaire s'affiche.
 */
export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Panneau de marque (desktop) */}
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-10 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo light />
          <div>
            <h2 className="text-3xl font-bold text-white">
              La compatibilité, <span className="text-accent-400">vérifiée pour vous.</span>
            </h2>
            <p className="mt-4 max-w-md text-slate-300">
              Composez vos kits Arduino / ESP32 en toute sérénité : tension, bus et
              broches contrôlés automatiquement avant l'achat.
            </p>
          </div>
          <p className="font-mono text-xs text-slate-500">// Farhane Labs — electronics marketplace</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {children}
          </Card>
          {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'

/**
 * Footer global — fond navy, responsive.
 */
const SECTIONS = [
  {
    title: 'Boutique',
    links: [
      { to: '/catalogue', label: 'Catalogue' },
      { to: '/configurateur', label: 'Configurateur' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { to: '/login', label: 'Connexion' },
      { to: '/register', label: 'Inscription' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-auto bg-navy text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm text-slate-400">
              La marketplace des composants et kits électroniques, avec un configurateur
              intelligent qui vérifie la compatibilité de votre montage (tension, bus, broches).
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white">{section.title}</h4>
              <ul className="mt-4 space-y-2">
                {section.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-slate-400 transition-colors hover:text-accent-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Farhane Labs — Projet full-stack MERN.
          </p>
          <p className="font-mono text-xs text-slate-500">Polytech Monastir · Montassar Farhane</p>
        </div>
      </div>
    </footer>
  )
}

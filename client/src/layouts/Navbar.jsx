import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CartIcon from '@/components/checkout/CartIcon'
import NotificationBell from '@/components/notifications/NotificationBell'
import { cn } from '@/utils/cn'

/**
 * Navbar responsive.
 * - reflète l'état d'auth : Connexion/Inscription si déconnecté,
 *   nom + menu déroulant + déconnexion si connecté.
 * - menu burger sur mobile.
 */

// Liens de navigation principaux (catalogue/configurateur arriveront plus tard)
const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/configurateur', label: 'Configurateur' },
]

// Libellés FR des rôles backend
const ROLE_LABELS = { client: 'Client', supplier: 'Fournisseur', admin: 'Admin' }

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'text-primary-700 bg-primary-50' : 'text-ink hover:text-primary-700 hover:bg-slate-100',
    )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Liens — desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Actions — desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <CartIcon />
          {isAuthenticated && <NotificationBell />}
          {!isAuthenticated ? (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Connexion
              </Button>
              <Button as={Link} to="/register" variant="primary" size="sm">
                Inscription
              </Button>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[8rem] truncate text-sm font-medium text-ink">{user.name}</span>
                <svg className="h-4 w-4 text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Menu déroulant */}
              {menuOpen && (
                <>
                  {/* Overlay invisible pour fermer au clic extérieur */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-elevated">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                      <Badge variant="primary" className="mt-2">
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </div>
                    <div className="py-1">
                      <DropdownLink to="/profil" onClick={() => setMenuOpen(false)}>
                        Mon profil
                      </DropdownLink>
                      {user.role === 'client' && (
                        <>
                          <DropdownLink to="/mon-compte" onClick={() => setMenuOpen(false)}>
                            Mon compte
                          </DropdownLink>
                          <DropdownLink to="/mes-kits" onClick={() => setMenuOpen(false)}>
                            Mes kits
                          </DropdownLink>
                          <DropdownLink to="/mes-commandes" onClick={() => setMenuOpen(false)}>
                            Mes commandes
                          </DropdownLink>
                        </>
                      )}
                      {user.role === 'supplier' && (
                        <DropdownLink to="/fournisseur" onClick={() => setMenuOpen(false)}>
                          Espace fournisseur
                        </DropdownLink>
                      )}
                      {user.role === 'admin' && (
                        <DropdownLink to="/admin" onClick={() => setMenuOpen(false)}>
                          Administration
                        </DropdownLink>
                      )}
                    </div>
                    <div className="border-t border-slate-100 p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-error-600 transition-colors hover:bg-error-50"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Panier + Burger — mobile */}
        <div className="flex items-center gap-1 md:hidden">
          {isAuthenticated && <NotificationBell />}
          <CartIcon onClick={() => setMobileOpen(false)} />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-ink hover:bg-slate-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Panneau mobile */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass}
                style={{ display: 'block' }}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Button as={Link} to="/login" variant="secondary" fullWidth onClick={() => setMobileOpen(false)}>
                  Connexion
                </Button>
                <Button as={Link} to="/register" variant="primary" fullWidth onClick={() => setMobileOpen(false)}>
                  Inscription
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <Button variant="danger" fullWidth onClick={handleLogout}>
                  Déconnexion
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function DropdownLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-slate-50 hover:text-primary-700"
    >
      {children}
    </Link>
  )
}

import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

/**
 * Logo Farhane Labs — pictogramme "puce/circuit" + nom de marque.
 * props :
 *  - to    : destination du lien (défaut '/')
 *  - light : version claire (texte blanc) pour les fonds sombres (footer)
 */
export default function Logo({ to = '/', light = false, className }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2.5 font-display', className)}
      aria-label="Farhane Labs — accueil"
    >
      {/* Pictogramme : puce électronique stylisée */}
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1" className="text-primary-700" fill="currentColor" />
          {/* broches */}
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
          </g>
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn('text-lg font-bold tracking-tight', light ? 'text-white' : 'text-navy')}>
          Farhane<span className="text-primary-500"> Labs</span>
        </span>
        <span className={cn('text-[10px] font-medium tracking-wide', light ? 'text-slate-400' : 'text-muted')}>
          ELECTRONICS MARKETPLACE
        </span>
      </span>
    </Link>
  )
}

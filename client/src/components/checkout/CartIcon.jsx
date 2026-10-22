import { Link } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'

/**
 * CartIcon — icône panier de la navbar avec pastille du nombre d'articles.
 * Lien vers /panier. Affichée pour tout le monde (le panier est public).
 */
export default function CartIcon({ onClick }) {
  const { totalItems } = useCart()

  return (
    <Link
      to="/panier"
      onClick={onClick}
      aria-label={`Panier (${totalItems} article${totalItems > 1 ? 's' : ''})`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-slate-100"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 6H6" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary-600 px-1 text-xs font-semibold text-white">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}

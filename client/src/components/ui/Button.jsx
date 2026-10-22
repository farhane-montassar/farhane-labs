import { cn } from '@/utils/cn'
import Spinner from './Spinner'

/**
 * Button — bouton réutilisable du design system.
 *
 * props :
 *  - variant : 'primary' | 'secondary' | 'ghost' | 'danger'  (défaut 'primary')
 *  - size    : 'sm' | 'md' | 'lg'                              (défaut 'md')
 *  - loading : affiche un spinner et désactive le bouton
 *  - fullWidth : occupe toute la largeur
 *  - as      : composant à rendre (ex: Link de react-router) ; défaut <button>
 */
const VARIANTS = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 focus-visible:outline-primary-600',
  secondary:
    'bg-white text-ink border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  ghost:
    'bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100',
  danger:
    'bg-error-600 text-white shadow-sm hover:bg-error-700 active:bg-error-700',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  as: Component = 'button',
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <Component
      className={cn(
        // base
        'inline-flex items-center justify-center rounded-md font-medium font-display',
        'transition-colors duration-150 select-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </Component>
  )
}

import { cn } from '@/utils/cn'

/**
 * Spinner — indicateur de chargement (SVG animé).
 * size : 'sm' | 'md' | 'lg'. Hérite de la couleur courante (text-*).
 */
const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
}

export default function Spinner({ size = 'md', className }) {
  return (
    <svg
      className={cn('animate-spin', SIZES[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Chargement"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

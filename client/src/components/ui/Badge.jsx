import { cn } from '@/utils/cn'

/**
 * Badge — pastille de statut/étiquette.
 * variant : 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'
 * Pratique pour les statuts du configurateur (compatible/warning/incompatible),
 * les rôles, le stock, etc.
 */
const VARIANTS = {
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  accent: 'bg-accent-50 text-accent-700 ring-accent-200',
  success: 'bg-success-50 text-success-700 ring-success-500/30',
  warning: 'bg-warning-50 text-warning-700 ring-warning-500/30',
  error: 'bg-error-50 text-error-700 ring-error-500/30',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-300',
}

export default function Badge({ variant = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

import { cn } from '@/utils/cn'

/**
 * Alert — message contextuel (info / succès / avertissement / erreur).
 * Idéal pour afficher les messages renvoyés par le backend.
 *
 * props :
 *  - variant : 'info' | 'success' | 'warning' | 'error'  (défaut 'info')
 *  - title   : titre optionnel
 *  - onClose : si fourni, affiche un bouton de fermeture
 */
const VARIANTS = {
  info: { box: 'bg-info-50 border-info-500/30 text-info-600', icon: 'ℹ️' },
  success: { box: 'bg-success-50 border-success-500/30 text-success-700', icon: '✅' },
  warning: { box: 'bg-warning-50 border-warning-500/30 text-warning-700', icon: '⚠️' },
  error: { box: 'bg-error-50 border-error-500/30 text-error-700', icon: '⛔' },
}

export default function Alert({ variant = 'info', title, onClose, className, children }) {
  const v = VARIANTS[variant]
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', v.box, className)}
    >
      <span aria-hidden className="mt-0.5 leading-none">
        {v.icon}
      </span>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-current opacity-60 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  )
}

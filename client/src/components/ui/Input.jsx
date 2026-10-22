import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Input — champ de formulaire avec label, message d'erreur et icône optionnelle.
 *
 * props :
 *  - label    : libellé au-dessus du champ
 *  - error    : message d'erreur (passe le champ en rouge)
 *  - hint     : texte d'aide sous le champ
 *  - leftIcon : élément affiché à gauche (ex: icône)
 *  - ...props : tout attribut natif <input> (type, value, onChange, required…)
 *
 * forwardRef pour pouvoir focus le champ depuis le parent si besoin.
 */
const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-md border bg-white text-ink placeholder:text-slate-400',
            'h-11 px-3.5 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
            'disabled:bg-slate-50 disabled:text-muted',
            leftIcon && 'pl-10',
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/30'
              : 'border-slate-300',
            className,
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-error-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export default Input

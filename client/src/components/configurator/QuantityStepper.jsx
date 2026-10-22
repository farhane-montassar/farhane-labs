import { cn } from '@/utils/cn'

/**
 * QuantityStepper — contrôle +/- pour la quantité d'un composant.
 * props : value (>=1), onDec, onInc, min (défaut 1), className
 */
export default function QuantityStepper({ value, onDec, onInc, min = 1, className }) {
  return (
    <div className={cn('inline-flex items-center rounded-md border border-slate-300 bg-white', className)}>
      <StepBtn label="Diminuer" onClick={onDec} disabled={value <= min}>
        −
      </StepBtn>
      <span className="min-w-[2rem] px-1 text-center font-mono text-sm font-medium text-navy">{value}</span>
      <StepBtn label="Augmenter" onClick={onInc}>
        +
      </StepBtn>
    </div>
  )
}

function StepBtn({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center text-lg leading-none text-ink transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

import { cn } from '@/utils/cn'

/**
 * Card — surface élevée réutilisable.
 *  - hover : ajoute une élévation au survol (utile pour les cartes cliquables)
 *  - padded : padding interne (défaut true)
 *  - as     : composant à rendre (ex: Link de react-router pour une carte cliquable) ; défaut <div>
 *
 * Sous-composants : Card.Header, Card.Body, Card.Footer (optionnels).
 */
export default function Card({ hover = false, padded = true, as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-card',
        hover && 'transition-shadow duration-200 hover:shadow-elevated',
        padded && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

Card.Header = function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

Card.Body = function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('text-sm text-muted', className)} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('mt-4 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  )
}

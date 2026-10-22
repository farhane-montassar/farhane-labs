import Card from '@/components/ui/Card'
import { cn } from '@/utils/cn'

/**
 * StatCard — carte de statistique clé pour les dashboards (fournisseur/admin/client).
 *
 * props :
 *  - label : libellé court (ex. « Composants »)
 *  - value : valeur principale (nombre déjà formaté ou string)
 *  - icon  : émoji/élément décoratif optionnel
 *  - accent : 'primary' | 'success' | 'warning' | 'error' | 'neutral' (teinte de l'icône)
 *  - hint  : petite précision sous la valeur (optionnel)
 */
const ACCENTS = {
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  neutral: 'bg-slate-100 text-slate-600',
}

export default function StatCard({ label, value, icon, accent = 'primary', hint }) {
  return (
    <Card className="flex items-center gap-4">
      {icon != null && (
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-lg text-xl', ACCENTS[accent])} aria-hidden>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold text-navy">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  )
}

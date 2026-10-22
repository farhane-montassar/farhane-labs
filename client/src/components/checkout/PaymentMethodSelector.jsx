import { cn } from '@/utils/cn'
import Badge from '@/components/ui/Badge'
import { formatPrice } from '@/utils/catalogue'
import { SHIPPING_FEE } from '@/utils/orders'

/**
 * PaymentMethodSelector — choix de la méthode de paiement à l'étape commande.
 *
 * 3 options adaptées au marché tunisien :
 *  - 'card' : carte internationale (Visa/Mastercard) via Stripe (mode test).
 *  - 'cod'  : paiement à la livraison (+ frais de livraison).
 *  - 'edinar' : carte tunisienne / e-Dinar — paiement en ligne SIMULÉ (démo), au
 *    même titre que Stripe en mode test. Pas de passerelle bancaire réelle.
 *
 * props : value ('card' | 'cod' | 'edinar'), onChange(method)
 */
const OPTIONS = [
  {
    id: 'card',
    label: 'Carte bancaire internationale',
    desc: 'Visa / Mastercard — paiement sécurisé par Stripe.',
    icon: '💳',
  },
  {
    id: 'cod',
    label: 'Paiement à la livraison',
    desc: `Réglez en espèces à la réception. Frais de livraison : ${formatPrice(SHIPPING_FEE)}.`,
    icon: '🚚',
  },
  {
    id: 'edinar',
    label: 'Carte tunisienne / e-Dinar',
    desc: 'Pour le marché tunisien. Paiement en ligne — démonstration (aucun débit réel).',
    icon: '🇹🇳',
    badge: 'Démo',
  },
]

export default function PaymentMethodSelector({ value, onChange }) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-lg font-semibold text-navy">Méthode de paiement</legend>

      {OPTIONS.map((opt) => {
        const selected = value === opt.id
        const disabled = Boolean(opt.disabled)
        return (
          <label
            key={opt.id}
            title={disabled ? 'Nécessite une passerelle bancaire locale — intégration à venir.' : undefined}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 transition-colors',
              disabled
                ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                : 'cursor-pointer hover:border-primary-400',
              selected ? 'border-primary-600 bg-primary-50/60 ring-1 ring-primary-500/40' : 'border-slate-300',
            )}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={opt.id}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(opt.id)}
              className="mt-1 h-4 w-4 accent-primary-600"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span aria-hidden>{opt.icon}</span>
                <span className="font-medium text-ink">{opt.label}</span>
                {opt.badge && <Badge variant="neutral">{opt.badge}</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted">{opt.desc}</p>
            </div>
          </label>
        )
      })}
    </fieldset>
  )
}

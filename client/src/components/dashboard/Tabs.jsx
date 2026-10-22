import { cn } from '@/utils/cn'

/**
 * Tabs — onglets légers pour naviguer entre les sections d'un dashboard.
 * Contrôlé par le parent (état local), sans sous-routes.
 *
 * props :
 *  - tabs : [{ id, label, badge? }]
 *  - value : id de l'onglet actif
 *  - onChange(id)
 */
export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex flex-wrap gap-1" role="tablist">
        {tabs.map((tab) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-muted hover:border-slate-300 hover:text-ink',
              )}
            >
              {tab.label}
              {tab.badge != null && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

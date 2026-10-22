import { cn } from '@/utils/cn'

/**
 * Stars — note en étoiles (lecture seule) à partir de ratingAverage / ratingCount.
 * Affiche 5 étoiles remplies proportionnellement à la moyenne, + le nombre d'avis.
 *
 * props : average (0-5), count (nombre d'avis), size ('sm' | 'md'), showCount
 */
export default function Stars({ average = 0, count = 0, size = 'sm', showCount = true, className }) {
  const pct = Math.max(0, Math.min(100, (average / 5) * 100))
  const dim = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative inline-flex" aria-label={`Note ${average.toFixed(1)} sur 5`}>
        {/* étoiles grises (fond) */}
        <Row className="text-slate-300" dim={dim} />
        {/* étoiles colorées (premier plan, clipées par largeur) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <Row className="text-warning-500" dim={dim} />
        </div>
      </div>
      {showCount && (
        <span className="text-xs text-muted">
          {count > 0 ? `${average.toFixed(1)} (${count})` : 'Aucun avis'}
        </span>
      )}
    </div>
  )
}

function Row({ className, dim }) {
  return (
    <div className={cn('flex', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className={dim} />
      ))}
    </div>
  )
}

function Star({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
    </svg>
  )
}

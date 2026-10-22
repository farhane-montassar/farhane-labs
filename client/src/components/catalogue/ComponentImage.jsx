import { useState } from 'react'
import { cn } from '@/utils/cn'
import { categoryLabel } from '@/utils/catalogue'

/**
 * ComponentImage — image d'un composant avec repli élégant.
 *
 * - si `src` est fourni et charge correctement -> <img>
 * - sinon (pas d'image OU onError) -> placeholder dégradé navy/cyan + icône puce + catégorie
 *
 * Jamais d'image cassée affichée. Réutilisable en carte (carré) comme en fiche produit.
 *
 * props : src, alt, category, className (ratio/forme géré par le parent)
 */
export default function ComponentImage({ src, alt, category, className }) {
  const [failed, setFailed] = useState(false)
  const showPlaceholder = !src || failed

  return (
    <div className={cn('relative overflow-hidden bg-slate-100', className)}>
      {showPlaceholder ? (
        <Placeholder category={category} />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  )
}

function Placeholder({ category }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy via-primary-900 to-accent-700">
      <ChipIcon className="h-12 w-12 text-accent-300/90" />
      {category && (
        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-slate-300/80">
          {categoryLabel(category)}
        </span>
      )}
    </div>
  )
}

// Icône « puce » (microcontrôleur) inline — évite toute dépendance externe.
function ChipIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 10h4v4h-4z" opacity="0.5" />
      <path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3" />
    </svg>
  )
}

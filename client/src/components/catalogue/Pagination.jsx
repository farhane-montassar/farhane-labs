import { cn } from '@/utils/cn'

/**
 * Pagination — navigation de pages branchée sur la réponse paginée du backend.
 *
 * props : page (page courante), pages (nombre total de pages), onPage(n)
 * N'affiche rien s'il n'y a qu'une page.
 */
export default function Pagination({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null

  // Fenêtre compacte de numéros autour de la page courante.
  const nums = pageWindow(page, pages)

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <PageBtn disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente">
        ‹
      </PageBtn>

      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-muted">
            …
          </span>
        ) : (
          <PageBtn key={n} active={n === page} onClick={() => onPage(n)}>
            {n}
          </PageBtn>
        ),
      )}

      <PageBtn disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Page suivante">
        ›
      </PageBtn>
    </nav>
  )
}

function PageBtn({ active, disabled, className, children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'text-ink hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Construit [1, …, p-1, p, p+1, …, last] sans dépasser les bornes.
function pageWindow(page, pages) {
  const out = []
  const push = (n) => out.push(n)
  const around = new Set([1, pages, page, page - 1, page + 1])
  let prev = 0
  for (let n = 1; n <= pages; n++) {
    if (around.has(n)) {
      if (n - prev > 1) push('…')
      push(n)
      prev = n
    }
  }
  return out
}

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { componentService } from '@/services/componentService'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import CatalogueFilters from '@/components/catalogue/CatalogueFilters'
import ProductCard from '@/components/catalogue/ProductCard'
import Pagination from '@/components/catalogue/Pagination'
import RequestComponentModal from '@/components/requests/RequestComponentModal'

/**
 * Catalogue — liste paginée des composants.
 *
 * Source de vérité des filtres = l'URL (useSearchParams). À chaque changement,
 * on relance GET /api/components avec les query params : le filtrage/tri/pagination
 * est fait CÔTÉ BACKEND (jamais en JS dans le navigateur).
 */
const PARAM_KEYS = ['search', 'category', 'voltage', 'minPrice', 'maxPrice', 'sort', 'page']

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [data, setData] = useState(null) // { items, total, page, pages, limit }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)

  // Filtres dérivés de l'URL.
  const filters = useMemo(() => {
    const f = {}
    for (const k of PARAM_KEYS) f[k] = searchParams.get(k) || ''
    return f
  }, [searchParams])

  // Requête backend à chaque changement de l'URL.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    componentService
      .list({ ...filters, page: filters.page || 1 })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Impossible de charger le catalogue.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters])

  // Met à jour l'URL. Tout changement de filtre (hors page) remet page=1.
  const updateParams = (partial) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(partial)) {
      if (value === '' || value === null || value === undefined) next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in partial)) next.delete('page')
    setSearchParams(next)
  }

  const resetFilters = () => setSearchParams(new URLSearchParams())
  const goToPage = (n) => {
    updateParams({ page: String(n) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const items = data?.items || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Catalogue</h1>
        <p className="mt-1 text-muted">
          Cartes, capteurs et modules — filtrez par catégorie, tension et prix.
        </p>
      </header>

      {/* CTA : demander un composant absent du catalogue */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50/60 px-5 py-4">
        <div>
          <p className="font-display font-semibold text-navy">Vous ne trouvez pas un composant ?</p>
          <p className="text-sm text-muted">Faites une demande : nos fournisseurs seront notifiés.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setRequestOpen(true)}>
          Faire une demande
        </Button>
      </div>

      <CatalogueFilters filters={filters} onChange={updateParams} onReset={resetFilters} />

      {/* Compteur de résultats */}
      {!loading && !error && data && (
        <p className="mt-4 text-sm text-muted">
          {data.total} composant{data.total > 1 ? 's' : ''} trouvé{data.total > 1 ? 's' : ''}
        </p>
      )}

      {/* États */}
      {loading ? (
        <div className="flex justify-center py-24 text-primary-600">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="error" title="Erreur" className="mt-6">
          {error}
        </Alert>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-ink">Aucun composant trouvé</p>
          <p className="mt-1 text-sm text-muted">Essayez d'élargir ou de réinitialiser vos filtres.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((c) => (
              <ProductCard key={c._id} component={c} />
            ))}
          </div>

          <div className="mt-10">
            <Pagination page={data.page} pages={data.pages} onPage={goToPage} />
          </div>
        </>
      )}

      {requestOpen && <RequestComponentModal onClose={() => setRequestOpen(false)} />}
    </div>
  )
}

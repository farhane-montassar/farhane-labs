import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { componentService } from '@/services/componentService'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import ComponentImage from '@/components/catalogue/ComponentImage'
import Stars from '@/components/catalogue/Stars'
import { useCart } from '@/hooks/useCart'
import { categoryLabel, categoryVariant, stockStatus, formatPrice, formatVoltage } from '@/utils/catalogue'

/**
 * ComponentDetail — fiche produit (/components/:id).
 * Détail via GET /api/components/:id, avis via GET /api/components/:id/reviews (lecture seule).
 */
export default function ComponentDetail() {
  const { id } = useParams()
  const { addItem } = useCart()

  const [component, setComponent] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setComponent(null)

    // Le détail est requis ; les avis sont secondaires (on n'échoue pas la page s'ils manquent).
    componentService
      .getById(id)
      .then((data) => {
        if (cancelled) return
        setComponent(data)
        return componentService.getReviews(id).then((r) => {
          if (!cancelled) setReviews(r || [])
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Composant introuvable.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-primary-600">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert variant="error" title="Composant introuvable">
          {error}
        </Alert>
        <Button as={Link} to="/catalogue" variant="secondary" className="mt-6">
          ← Retour au catalogue
        </Button>
      </div>
    )
  }

  const { name, description, category, price, stock, images, supplier, ratingAverage, ratingCount } = component
  const stockInfo = stockStatus(stock)
  const isBoard = category === 'board'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/catalogue" className="text-sm font-medium text-primary-700 hover:underline">
        ← Retour au catalogue
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* ---------- Visuel ---------- */}
        <div>
          <ComponentImage
            src={images?.[0]}
            alt={name}
            category={category}
            className="aspect-square rounded-xl border border-slate-200"
          />
          {/* Vignettes si plusieurs images */}
          {images?.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(0, 4).map((src, i) => (
                <ComponentImage
                  key={i}
                  src={src}
                  alt={`${name} ${i + 1}`}
                  category={category}
                  className="aspect-square rounded-lg border border-slate-200"
                />
              ))}
            </div>
          )}
        </div>

        {/* ---------- Infos ---------- */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={categoryVariant(category)}>{categoryLabel(category)}</Badge>
            <Badge variant={stockInfo.variant}>{stockInfo.label}</Badge>
          </div>

          <h1 className="mt-3 text-3xl font-bold">{name}</h1>

          <div className="mt-3">
            <Stars average={ratingAverage} count={ratingCount} size="md" />
          </div>

          <p className="mt-4 font-mono text-3xl font-semibold text-navy">{formatPrice(price)}</p>

          {supplier?.companyName && (
            <p className="mt-3 text-sm text-muted">
              Vendu par <span className="font-medium text-ink">{supplier.companyName}</span>
            </p>
          )}

          <Button
            size="lg"
            className="mt-5"
            disabled={stock <= 0}
            onClick={() => addItem(component, 1)}
          >
            {stock <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </Button>

          {description && <p className="mt-5 text-sm leading-relaxed text-ink">{description}</p>}

          {/* ---------- Specs techniques ---------- */}
          <Specs component={component} isBoard={isBoard} />
        </div>
      </div>

      {/* ---------- Avis ---------- */}
      <Reviews reviews={reviews} average={ratingAverage} count={ratingCount} />
    </div>
  )
}

/* ============ Specs ============ */
function Specs({ component, isBoard }) {
  const specs = component.specs || {}
  const caps = component.boardCapabilities || {}

  const rows = isBoard
    ? [
        ['Tensions supportées', caps.voltagesSupported?.length ? `${caps.voltagesSupported.join(' / ')} V` : null],
        ['Broches numériques', caps.digitalPins],
        ['Broches analogiques', caps.analogPins],
        ['Bus', caps.buses?.length ? caps.buses.join(', ') : null],
      ]
    : [
        ['Tension', formatVoltage(specs)],
        ['Interface', specs.interface],
        ['Broches utilisées', specs.pinsUsed],
        ['Sortie alimentation', specs.powerOutput?.voltage != null
          ? `${specs.powerOutput.voltage} V${specs.powerOutput.currentA != null ? ` / ${specs.powerOutput.currentA} A` : ''}`
          : null],
      ]

  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')

  // Mentions spéciales pour la logique avancée du configurateur.
  const flags = []
  if (specs.requiresDriver) flags.push('Nécessite un driver')
  if (specs.requiresExternalPower) flags.push('Alimentation externe requise')
  if (specs.isDriver) flags.push('Driver de moteur')
  if (specs.isPowerSupply) flags.push('Alimentation')

  if (visible.length === 0 && !specs.notes && flags.length === 0) return null

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Caractéristiques techniques</h2>

      {flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {flags.map((f) => (
            <Badge key={f} variant="warning">{f}</Badge>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <dl className="mt-3 divide-y divide-slate-200">
          {visible.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-mono text-sm font-medium text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {specs.notes && <p className="mt-4 text-sm leading-relaxed text-ink">{specs.notes}</p>}
    </div>
  )
}

/* ============ Avis ============ */
function Reviews({ reviews, average, count }) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Avis clients</h2>
        {count > 0 && <Stars average={average} count={count} size="md" />}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-muted">
          Aucun avis pour ce composant pour le moment.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((rev) => (
            <li key={rev._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                    {rev.user?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                  <span className="text-sm font-medium text-ink">{rev.user?.name || 'Client'}</span>
                </div>
                <Stars average={rev.rating} count={0} showCount={false} />
              </div>
              {rev.comment && <p className="mt-3 text-sm leading-relaxed text-ink">{rev.comment}</p>}
              {rev.createdAt && (
                <p className="mt-2 text-xs text-muted">
                  {new Date(rev.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

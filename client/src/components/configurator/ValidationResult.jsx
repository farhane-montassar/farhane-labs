import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { formatPrice } from '@/utils/catalogue'

/**
 * ValidationResult — verdict de compatibilité (source : backend uniquement).
 *
 * Affiche, par ordre de priorité : invitation à se connecter (non authentifié),
 * invitation à ajouter un composant (config vide), erreur API, puis le résultat
 * (statut visuel + messages + utilisation des broches + prix total).
 *
 * props :
 *  - isAuthenticated : bool
 *  - itemCount : nombre de composants dans la config
 *  - loading : validation en cours
 *  - error   : message d'erreur API (string) ou ''
 *  - result  : { status, messages, usedPins, availablePins, totalPrice } | null
 *  - onAutoFix(ids) : applique les correctifs auto (ajoute les composants au config)
 *  - justFixed : bool — une auto-correction vient d'être appliquée (retour visuel)
 *
 * messages : tableau d'objets { type, message, solution?, fixComponentId? } renvoyé par
 * le moteur (enrichi par le backend). `solution` n'est présent que pour une adaptation ;
 * `fixComponentId` seulement quand un composant correctif du catalogue peut la résoudre.
 */
const STATUS = {
  compatible: { variant: 'success', label: 'Configuration compatible', icon: '✓', box: 'bg-success-50 border-success-500/40 text-success-700' },
  compatible_adaptation: { variant: 'warning', label: 'Compatible avec adaptation', icon: '⚠', box: 'bg-warning-50 border-warning-500/40 text-warning-700' },
  incompatible: { variant: 'error', label: 'Configuration incompatible', icon: '✕', box: 'bg-error-50 border-error-500/40 text-error-700' },
  // Alias rétrocompatible : ancien statut « warning » → adaptation.
  warning: { variant: 'warning', label: 'Compatible avec adaptation', icon: '⚠', box: 'bg-warning-50 border-warning-500/40 text-warning-700' },
}

export default function ValidationResult({ isAuthenticated, itemCount, loading, error, result, onAutoFix, justFixed }) {
  // Correctifs auto-applicables : messages portant un composant correctif identifié.
  // Dédupliqués par id (une même alim peut résoudre plusieurs problèmes).
  const fixable = result?.messages?.filter((m) => m.fixComponentId) || []
  const fixIds = [...new Set(fixable.map((m) => m.fixComponentId))]
  const canAutoFix = result?.status === 'compatible_adaptation' && fixIds.length > 0

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-navy">Compatibilité</h2>

      {!isAuthenticated ? (
        <Alert variant="info" title="Connectez-vous pour vérifier la compatibilité">
          <p>La validation en temps réel (tension, bus, broches, driver, alimentation) nécessite un compte.</p>
          <Button as={Link} to="/login" variant="primary" size="sm" className="mt-3">
            Se connecter
          </Button>
        </Alert>
      ) : itemCount === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-muted">
          Ajoutez au moins un composant pour lancer la vérification de compatibilité.
        </p>
      ) : (
        <>
          {/* Bandeau de statut (ou chargement initial) */}
          {loading && !result ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 py-8 text-primary-600">
              <Spinner size="md" />
              <span className="text-sm font-medium text-muted">Validation en cours…</span>
            </div>
          ) : result ? (
            <StatusBanner status={result.status} loading={loading} />
          ) : null}

          {error && (
            <Alert variant="error" title="Erreur de validation">
              {error}
            </Alert>
          )}

          {result && (
            <>
              {/* Retour visuel après auto-correction réussie (statut redevenu 🟢). */}
              {justFixed && result.status === 'compatible' && (
                <div className="flex items-center gap-2 rounded-lg border border-success-500/40 bg-success-50 px-3 py-2 text-sm font-medium text-success-700">
                  <span aria-hidden>✓</span>
                  <span>Configuration corrigée — tous les problèmes résolus.</span>
                </div>
              )}

              {/* Messages explicatifs du backend — la valeur du produit.
                  Chaque message = { type, message, solution? } ; la solution
                  (adaptation) est mise en avant sous le problème. */}
              {result.messages?.length > 0 && (
                <ul className="space-y-2.5">
                  {result.messages.map((m, i) => (
                    <li key={i} className="flex flex-col gap-1 text-sm leading-snug text-ink">
                      <span className="flex gap-2">
                        <span aria-hidden className="select-none">•</span>
                        <span>{m.message}</span>
                      </span>
                      {m.solution && (
                        <span className="ml-4 flex gap-1.5 rounded-md bg-warning-50 px-2 py-1 text-warning-700">
                          <span aria-hidden className="select-none">💡</span>
                          <span><span className="font-semibold">Solution :</span> {m.solution}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Auto-correction : visible seulement si au moins un problème d'adaptation
                  a un composant correctif identifié. Les vrais blocages 🔴 n'en ont pas. */}
              {canAutoFix && (
                <Button
                  variant="primary"
                  size="sm"
                  className="self-start"
                  onClick={() => onAutoFix?.(fixIds)}
                  disabled={loading}
                >
                  🔧 Corriger automatiquement
                </Button>
              )}

              {/* Utilisation des broches */}
              <PinUsage used={result.usedPins} available={result.availablePins} />

              {/* Prix total */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-muted">Prix total</span>
                <span className="font-mono text-2xl font-bold text-navy">{formatPrice(result.totalPrice)}</span>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  )
}

function StatusBanner({ status, loading }) {
  const s = STATUS[status] || STATUS.warning
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${s.box}`}>
      <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-lg font-bold">
        {s.icon}
      </span>
      <span className="flex-1 font-display text-base font-semibold">{s.label}</span>
      {loading && <Spinner size="sm" />}
    </div>
  )
}

function PinUsage({ used = 0, available = 0 }) {
  const over = used > available
  const pct = available > 0 ? Math.min((used / available) * 100, 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-muted">Broches utilisées</span>
        <span className={`font-mono font-medium ${over ? 'text-error-600' : 'text-navy'}`}>
          {used} / {available}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-error-500' : 'bg-primary-600'}`}
          style={{ width: `${over ? 100 : pct}%` }}
        />
      </div>
    </div>
  )
}

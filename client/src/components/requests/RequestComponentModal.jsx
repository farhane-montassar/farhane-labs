import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { componentRequestService } from '@/services/componentRequestService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

/**
 * RequestComponentModal — modale « demander un composant absent du catalogue ».
 *
 * Gating d'auth (comme ValidationResult) : invite à se connecter si non authentifié,
 * message clair si l'utilisateur n'est pas un client (seul le rôle client peut demander).
 *
 * props :
 *  - onClose() : ferme la modale
 *  - onCreated(request) : appelé après succès (pour rafraîchir une liste éventuelle)
 */
export default function RequestComponentModal({ onClose, onCreated }) {
  const { isAuthenticated, user } = useAuth()
  const isClient = user?.role === 'client'

  const [form, setForm] = useState({ componentName: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.componentName.trim()) {
      setError('Indiquez le nom du composant souhaité.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const created = await componentRequestService.create({
        componentName: form.componentName.trim(),
        description: form.description.trim(),
      })
      setDone(true)
      onCreated?.(created)
    } catch (err) {
      setError(err.message || "L'envoi de la demande a échoué.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-elevated">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-navy">Demander un composant</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-slate-100 hover:text-ink"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {!isAuthenticated ? (
            <Alert variant="info" title="Connectez-vous pour faire une demande">
              <p>Les demandes de composant sont réservées aux clients connectés.</p>
              <Button as={Link} to="/login" variant="primary" size="sm" className="mt-3" onClick={onClose}>
                Se connecter
              </Button>
            </Alert>
          ) : !isClient ? (
            <Alert variant="info" title="Compte client requis">
              Seuls les comptes clients peuvent demander l'ajout d'un composant au catalogue.
            </Alert>
          ) : done ? (
            <Alert variant="success" title="Demande envoyée 🎉">
              <p>Les fournisseurs ont été notifiés. Vous serez prévenu(e) dès qu'un composant correspondant sera disponible.</p>
              <Button variant="primary" size="sm" className="mt-3" onClick={onClose}>
                Fermer
              </Button>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="error" title="Erreur">
                  {error}
                </Alert>
              )}
              <Input
                label="Composant souhaité"
                value={form.componentName}
                onChange={set('componentName')}
                required
                placeholder="Ex. Capteur de gaz MQ-2"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Précisions (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                  placeholder="Tension, interface, usage prévu, référence…"
                  className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={saving} className="flex-1">
                  Envoyer la demande
                </Button>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

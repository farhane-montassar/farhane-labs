import { useState } from 'react'
import { componentService } from '@/services/componentService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { CATEGORIES } from '@/utils/catalogue'

/**
 * ComponentForm — modale de création / édition d'un composant (dashboard fournisseur).
 *
 * - Sans `component` → création (POST /components).
 * - Avec `component` → édition (PUT /components/:id).
 * Le `supplier` est déduit du token côté backend : on ne l'envoie jamais.
 *
 * props :
 *  - component : composant à éditer (ou null pour créer)
 *  - onClose() : ferme la modale sans rien faire
 *  - onSaved(saved) : appelé après succès avec le composant créé/modifié
 */

// Interfaces autorisées par le backend (component.validator).
const INTERFACES = ['I2C', 'SPI', 'UART', 'analog', 'digital', 'power', 'PWM', 'driver', 'USB', 'wireless']

export default function ComponentForm({ component, onClose, onSaved }) {
  const isEdit = Boolean(component)
  const [form, setForm] = useState(() => ({
    name: component?.name || '',
    description: component?.description || '',
    category: component?.category || 'board',
    price: component?.price ?? '',
    stock: component?.stock ?? '',
    images: component?.images?.[0] || '',
    voltage: component?.specs?.voltage ?? '',
    interface: component?.specs?.interface || '',
    pinsUsed: component?.specs?.pinsUsed ?? '',
    notes: component?.specs?.notes || '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  // Construit le payload attendu par l'API : nombres typés, specs/images filtrées.
  const buildPayload = () => {
    const specs = {}
    if (form.voltage !== '') specs.voltage = Number(form.voltage)
    if (form.interface) specs.interface = form.interface
    if (form.pinsUsed !== '') specs.pinsUsed = Number(form.pinsUsed)
    if (form.notes.trim()) specs.notes = form.notes.trim()

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
    }
    if (form.stock !== '') payload.stock = Number(form.stock)
    if (form.images.trim()) payload.images = [form.images.trim()]
    if (Object.keys(specs).length) payload.specs = specs
    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.price === '') {
      setError('Le nom et le prix sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      const saved = isEdit
        ? await componentService.update(component._id, payload)
        : await componentService.create(payload)
      onSaved(saved)
    } catch (err) {
      setError(err.message || "L'enregistrement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-elevated">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-navy">
            {isEdit ? 'Modifier le composant' : 'Nouveau composant'}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <Alert variant="error" title="Erreur">
              {error}
            </Alert>
          )}

          <Input label="Nom" value={form.name} onChange={set('name')} required placeholder="Capteur PIR HC-SR501" />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={2}
              placeholder="Détecteur de mouvement infrarouge…"
              className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Catégorie</label>
              <select
                value={form.category}
                onChange={set('category')}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-ink transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                {Object.entries(CATEGORIES).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Prix (TND)" type="number" min="0" step="0.5" value={form.price} onChange={set('price')} required placeholder="35" />
            <Input label="Stock" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} placeholder="50" />
          </div>

          <Input
            label="Image (URL)"
            value={form.images}
            onChange={set('images')}
            placeholder="/images/mon-composant.jpg"
            hint="Une URL d'image. Laisser vide pour afficher le visuel par défaut."
          />

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Spécifications (optionnel)</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Tension (V)" type="number" min="0" step="0.1" value={form.voltage} onChange={set('voltage')} placeholder="5" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Interface</label>
                <select
                  value={form.interface}
                  onChange={set('interface')}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-ink transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                >
                  <option value="">—</option>
                  {INTERFACES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Broches utilisées" type="number" min="0" step="1" value={form.pinsUsed} onChange={set('pinsUsed')} placeholder="1" />
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">Notes techniques</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={2}
                placeholder="ATmega328P, 14 E/S numériques…"
                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Enregistrer' : 'Créer le composant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

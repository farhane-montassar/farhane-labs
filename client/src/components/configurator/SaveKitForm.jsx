import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { kitService } from '@/services/kitService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

/**
 * SaveKitForm — sauvegarde de la configuration courante en Kit.
 *
 * N'apparaît que pour un CLIENT connecté avec une config validée (contrainte
 * backend : POST /api/kits réservé au rôle client). Une config `incompatible`
 * n'est pas sauvegardable ; `compatible_adaptation` l'est (avec une mention).
 *
 * props : board, items ([{ component, quantity }]), status
 *         ('compatible'|'compatible_adaptation'|'incompatible')
 */
export default function SaveKitForm({ board, items, status }) {
  const { isAuthenticated, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedKit, setSavedKit] = useState(null)

  // Réservé au client, et seulement quand une validation a renvoyé un statut.
  if (!isAuthenticated || user?.role !== 'client' || !status) return null

  // Config bloquante : on n'autorise pas la sauvegarde.
  if (status === 'incompatible') {
    return (
      <Card>
        <p className="text-center text-sm text-muted">
          Corrigez les incompatibilités pour pouvoir sauvegarder ce kit.
        </p>
      </Card>
    )
  }

  // Succès : confirmation + accès à la liste.
  if (savedKit) {
    return (
      <Card>
        <Alert variant="success" title="Kit enregistré">
          « {savedKit.name} » a bien été sauvegardé.
          <div className="mt-3 flex flex-wrap gap-2">
            <Button as={Link} to="/mes-kits" size="sm">
              Voir mes kits
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSavedKit(null)}>
              Sauvegarder à nouveau
            </Button>
          </div>
        </Alert>
      </Card>
    )
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Donnez un nom à votre kit.')
      return
    }
    setSaving(true)
    setError('')
    kitService
      .create({
        name: trimmed,
        boardId: board._id,
        items: items.map(({ component, quantity }) => ({ componentId: component._id, quantity })),
      })
      .then((kit) => {
        setSavedKit(kit)
        setOpen(false)
        setName('')
      })
      .catch((err) => setError(err.message || 'Sauvegarde impossible.'))
      .finally(() => setSaving(false))
  }

  return (
    <Card>
      {!open ? (
        <Button fullWidth onClick={() => { setOpen(true); setError('') }}>
          Sauvegarder ma configuration
        </Button>
      ) : (
        <div className="space-y-3">
          <Input
            label="Nom du kit"
            placeholder="Ex. Bras robotisé v1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">
              Enregistrer
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setOpen(false); setName(''); setError('') }}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="error" className="mt-3">
          {error}
        </Alert>
      )}

      {(status === 'compatible_adaptation' || status === 'warning') && !error && (
        <p className="mt-2 text-xs text-muted">
          Cette configuration nécessite une adaptation (voir les solutions ci-dessus), mais reste sauvegardable.
        </p>
      )}
    </Card>
  )
}

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { componentService } from '@/services/componentService'
import { configuratorService } from '@/services/configuratorService'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import BoardSelector from '@/components/configurator/BoardSelector'
import ComponentPicker from '@/components/configurator/ComponentPicker'
import ConfigPanel from '@/components/configurator/ConfigPanel'
import ValidationResult from '@/components/configurator/ValidationResult'
import AddKitToCart from '@/components/configurator/AddKitToCart'
import SaveKitForm from '@/components/configurator/SaveKitForm'

/**
 * Configurator — page /configurateur. Pièce maîtresse : on assemble une carte +
 * des composants, et le BACKEND valide la compatibilité en temps réel.
 *
 * État : useReducer { board, items: { [id]: { component, quantity } } }.
 * Validation : effet debouncé (400 ms) + anti-race (requestId) ; appelée seulement
 * si l'utilisateur est connecté, une carte est choisie et au moins un composant ajouté
 * (le backend impose items non vide).
 */

// --- Réducteur de configuration ---
const initialState = { board: null, items: {} }

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BOARD':
      return { ...state, board: action.board }
    case 'CLEAR_BOARD':
      return { ...state, board: null }
    case 'ADD_ITEM': {
      const id = action.component._id
      const current = state.items[id]
      const quantity = current ? current.quantity + 1 : 1
      return { ...state, items: { ...state.items, [id]: { component: action.component, quantity } } }
    }
    case 'INC': {
      const it = state.items[action.id]
      if (!it) return state
      return { ...state, items: { ...state.items, [action.id]: { ...it, quantity: it.quantity + 1 } } }
    }
    case 'DEC': {
      const it = state.items[action.id]
      if (!it) return state
      return { ...state, items: { ...state.items, [action.id]: { ...it, quantity: Math.max(1, it.quantity - 1) } } }
    }
    case 'REMOVE': {
      const next = { ...state.items }
      delete next[action.id]
      return { ...state, items: next }
    }
    case 'CLEAR_ITEMS':
      return { ...state, items: {} }
    default:
      return state
  }
}

export default function Configurator() {
  const { isAuthenticated } = useAuth()

  // --- Chargement initial des composants (une seule requête) ---
  const [boards, setBoards] = useState([])
  const [addables, setAddables] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    setLoadError('')
    componentService
      .list({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        const items = res.items || []
        setBoards(items.filter((c) => c.category === 'board'))
        setAddables(items.filter((c) => c.category !== 'board'))
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Impossible de charger les composants.')
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // --- État de la configuration ---
  const [state, dispatch] = useReducer(reducer, initialState)
  const itemsArr = useMemo(() => Object.values(state.items), [state.items])
  const addedIds = useMemo(() => new Set(Object.keys(state.items)), [state.items])

  // Index id → composant (cartes + ajoutables) pour résoudre les correctifs auto.
  const componentsById = useMemo(() => {
    const map = new Map()
    for (const c of boards) map.set(c._id, c)
    for (const c of addables) map.set(c._id, c)
    return map
  }, [boards, addables])

  // « Configuration corrigée ✓ » : vrai juste après une auto-correction, remis à faux
  // dès que l'utilisateur modifie la config manuellement.
  const [justFixed, setJustFixed] = useState(false)

  // Ajoute au config les composants correctifs recommandés (même action que l'ajout
  // manuel → la validation temps réel se relance toute seule).
  const handleAutoFix = (ids) => {
    let added = false
    for (const id of ids) {
      const component = componentsById.get(id)
      if (component) {
        dispatch({ type: 'ADD_ITEM', component })
        added = true
      }
    }
    if (added) setJustFixed(true)
  }

  // Toute modification manuelle annule l'état « corrigé ».
  const manual = (action) => {
    setJustFixed(false)
    dispatch(action)
  }

  // --- Validation temps réel : debounce + anti-race ---
  const [result, setResult] = useState(null)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const reqIdRef = useRef(0)

  useEffect(() => {
    // Toute exécution invalide les réponses en vol précédentes (anti-race).
    const myReq = ++reqIdRef.current

    // Conditions d'appel : connecté + carte + au moins un composant.
    if (!isAuthenticated || !state.board || itemsArr.length === 0) {
      setValidating(false)
      setValidationError('')
      setResult(null)
      return
    }

    const handle = setTimeout(() => {
      setValidating(true)
      setValidationError('')
      configuratorService
        .validate({
          boardId: state.board._id,
          items: itemsArr.map(({ component, quantity }) => ({ componentId: component._id, quantity })),
        })
        .then((data) => {
          if (myReq === reqIdRef.current) setResult(data)
        })
        .catch((err) => {
          if (myReq !== reqIdRef.current) return
          setResult(null)
          setValidationError(err.message || 'Validation impossible.')
        })
        .finally(() => {
          if (myReq === reqIdRef.current) setValidating(false)
        })
    }, 400)

    return () => clearTimeout(handle)
  }, [isAuthenticated, state.board, itemsArr])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Configurateur</h1>
        <p className="mt-1 text-muted">
          Choisissez une carte, ajoutez vos composants — la compatibilité est vérifiée en temps réel.
        </p>
      </header>

      {loadingData ? (
        <div className="flex justify-center py-24 text-primary-600">
          <Spinner size="lg" />
        </div>
      ) : loadError ? (
        <Alert variant="error" title="Erreur">
          {loadError}
        </Alert>
      ) : (
        <div className="space-y-8">
          {/* Étape 1 — Carte */}
          <BoardSelector
            boards={boards}
            selected={state.board}
            onSelect={(board) => manual({ type: 'SET_BOARD', board })}
            onChange={() => manual({ type: 'CLEAR_BOARD' })}
          />

          {/* Étapes 2 & 3 — visibles une fois la carte choisie */}
          {state.board && (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Colonne gauche : ajout de composants */}
              <div className="lg:col-span-2">
                <ComponentPicker
                  components={addables}
                  addedIds={addedIds}
                  onAdd={(component) => manual({ type: 'ADD_ITEM', component })}
                />
              </div>

              {/* Colonne droite : configuration + verdict (sticky) */}
              <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
                <ConfigPanel
                  items={itemsArr}
                  onInc={(id) => manual({ type: 'INC', id })}
                  onDec={(id) => manual({ type: 'DEC', id })}
                  onRemove={(id) => manual({ type: 'REMOVE', id })}
                  onClear={() => manual({ type: 'CLEAR_ITEMS' })}
                />
                <ValidationResult
                  isAuthenticated={isAuthenticated}
                  itemCount={itemsArr.length}
                  loading={validating}
                  error={validationError}
                  result={result}
                  onAutoFix={handleAutoFix}
                  justFixed={justFixed}
                />
                <AddKitToCart board={state.board} items={itemsArr} status={result?.status} />
                <SaveKitForm board={state.board} items={itemsArr} status={result?.status} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

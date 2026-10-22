import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

/**
 * CartContext — panier d'achat global.
 *
 * State : items = [{ component, quantity }] (on stocke l'objet composant complet
 * pour l'affichage : nom, prix, image, catégorie). Persisté dans localStorage
 * pour survivre au rechargement.
 *
 * ⚠️ Le total ici est INDICATIF. Le total qui fait foi est recalculé par le
 * backend à la création de la commande (POST /api/orders).
 */
export const CartContext = createContext(null)

const STORAGE_KEY = 'farhane_cart'

// Lecture initiale tolérante (localStorage absent / JSON corrompu).
function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored)

  // Persistance à chaque changement.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // quota plein / mode privé : on ignore, le panier reste en mémoire.
    }
  }, [items])

  // Ajoute un composant (ou incrémente sa quantité s'il est déjà présent).
  const addItem = useCallback((component, qty = 1) => {
    if (!component?._id) return
    setItems((prev) => {
      const existing = prev.find((it) => it.component._id === component._id)
      if (existing) {
        return prev.map((it) =>
          it.component._id === component._id ? { ...it, quantity: it.quantity + qty } : it,
        )
      }
      return [...prev, { component, quantity: qty }]
    })
  }, [])

  const updateQuantity = useCallback((componentId, quantity) => {
    const q = Math.max(1, Number(quantity) || 1)
    setItems((prev) => prev.map((it) => (it.component._id === componentId ? { ...it, quantity: q } : it)))
  }, [])

  const removeItem = useCallback((componentId) => {
    setItems((prev) => prev.filter((it) => it.component._id !== componentId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const totalItems = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items])
  const totalPrice = useMemo(
    () => items.reduce((sum, it) => sum + (it.component.price || 0) * it.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clear, totalItems, totalPrice }),
    [items, addItem, updateQuantity, removeItem, clear, totalItems, totalPrice],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

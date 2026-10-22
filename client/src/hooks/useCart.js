import { useContext } from 'react'
import { CartContext } from '@/context/CartContext'

/**
 * useCart — raccourci d'accès au panier.
 * Lève une erreur si utilisé hors d'un <CartProvider>.
 */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart doit être utilisé à l’intérieur d’un <CartProvider>')
  }
  return ctx
}

export default useCart

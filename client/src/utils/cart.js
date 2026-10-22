/**
 * Helpers panier partagés (configurateur, « Mes kits »).
 *
 * Le panier (CartContext) stocke des { component, quantity }. Une config/kit n'est
 * qu'un ensemble d'articles : la CARTE (board) + les composants montés. On les
 * ajoute donc comme des articles normaux — addItem additionne les quantités si un
 * composant est déjà présent (comportement voulu).
 */

/**
 * Ajoute une config complète au panier.
 * @param addItem  fonction du CartContext : addItem(component, qty = 1)
 * @param board    composant de catégorie 'board' (objet complet : _id, price, …)
 * @param lines    [{ component, quantity }] — composants montés sur la carte
 * @returns {number} nombre de lignes ajoutées (carte incluse)
 */
export function addKitToCart(addItem, board, lines = []) {
  let added = 0
  if (board?._id) {
    addItem(board, 1)
    added += 1
  }
  for (const line of lines) {
    if (line?.component?._id) {
      addItem(line.component, line.quantity || 1)
      added += 1
    }
  }
  return added
}

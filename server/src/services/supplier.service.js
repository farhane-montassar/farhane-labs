const supplierRepository = require('../repositories/supplier.repository');
const componentRepository = require('../repositories/component.repository');
const orderRepository = require('../repositories/order.repository');
const ApiError = require('../utils/ApiError');

// Service Dashboard Fournisseur : un fournisseur ne voit QUE ses propres données.
//
// SÉCURITÉ : le Supplier est TOUJOURS déduit du token (req.user.id), jamais d'un
// id fourni par le client. Toutes les requêtes sont filtrées par ce Supplier._id,
// si bien qu'un fournisseur ne peut accéder aux données d'un autre.

const LOW_STOCK_THRESHOLD = 5;

// Retrouve le profil Supplier de l'utilisateur connecté et exige qu'il soit
// approuvé (mêmes règles que la création de composants).
async function resolveApprovedSupplier(user) {
  const supplier = await supplierRepository.findByUser(user.id);
  if (!supplier) {
    throw new ApiError(403, 'Aucun profil fournisseur associé à ce compte');
  }
  if (supplier.status !== 'approved') {
    throw new ApiError(403, 'Votre compte fournisseur doit être approuvé');
  }
  return supplier;
}

// Ne conserve, dans chaque commande, que les items du fournisseur courant +
// recalcule un sous-total propre à ce fournisseur. On ne lui expose jamais les
// items des autres fournisseurs.
function projectOrderForSupplier(order, supplierId) {
  const myItems = order.items.filter((it) => {
    const sid = it.supplier && it.supplier._id ? it.supplier._id : it.supplier;
    return String(sid) === String(supplierId);
  });
  const supplierSubtotal = myItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return {
    _id: order._id,
    user: order.user,
    status: order.status,
    createdAt: order.createdAt,
    shippingAddress: order.shippingAddress,
    items: myItems,
    supplierSubtotal: Math.round(supplierSubtotal * 100) / 100
  };
}

const supplierService = {
  // Les composants du fournisseur connecté.
  async listComponents(user) {
    const supplier = await resolveApprovedSupplier(user);
    return componentRepository.findBySupplier(supplier._id);
  },

  // Les commandes contenant ses composants (items filtrés aux siens).
  async listOrders(user) {
    const supplier = await resolveApprovedSupplier(user);
    const orders = await orderRepository.findBySupplier(supplier._id);
    return orders.map((o) => projectOrderForSupplier(o, supplier._id));
  },

  // Statistiques simples du fournisseur.
  async stats(user) {
    const supplier = await resolveApprovedSupplier(user);

    const [componentCount, sales, orderCount, lowStock] = await Promise.all([
      componentRepository.countBySupplier(supplier._id),
      orderRepository.salesStatsBySupplier(supplier._id),
      orderRepository.countBySupplier(supplier._id),
      componentRepository.findLowStockBySupplier(supplier._id, LOW_STOCK_THRESHOLD)
    ]);

    return {
      componentCount,
      orderCount,                    // toutes commandes le concernant
      paidOrderCount: sales.paidOrderCount,
      totalSales: sales.totalSales,  // CA de ses items payés
      lowStock                       // [{ _id, name, stock }]
    };
  }
};

module.exports = supplierService;

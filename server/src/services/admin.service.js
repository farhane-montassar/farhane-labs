const userRepository = require('../repositories/user.repository');
const supplierRepository = require('../repositories/supplier.repository');
const componentRepository = require('../repositories/component.repository');
const orderRepository = require('../repositories/order.repository');
const ApiError = require('../utils/ApiError');

// Service Dashboard Admin : supervision globale de la plateforme.
// L'accès est déjà restreint au rôle admin par le middleware de route.

const VALID_SUPPLIER_STATUSES = ['approved', 'rejected'];

const adminService = {
  // Liste des fournisseurs (filtre optionnel ?status=pending|approved|rejected).
  async listSuppliers(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    return supplierRepository.findAll(filter);
  },

  // Change le statut d'un fournisseur (approve/reject).
  async setSupplierStatus(id, status) {
    if (!VALID_SUPPLIER_STATUSES.includes(status)) {
      throw new ApiError(400, 'Statut invalide');
    }
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new ApiError(404, 'Fournisseur introuvable');
    }
    return supplierRepository.updateStatus(id, status);
  },

  // Liste de tous les utilisateurs (filtre optionnel ?role=client|supplier|admin).
  async listUsers(query = {}) {
    const filter = {};
    if (query.role) filter.role = query.role;
    return userRepository.findAll(filter);
  },

  // Toutes les commandes.
  async listOrders() {
    return orderRepository.findAll();
  },

  // Statistiques globales de la plateforme.
  async stats() {
    const [userCount, suppliersByStatus, componentCount, orderCount, paidOrderCount, revenue] =
      await Promise.all([
        userRepository.count(),
        supplierRepository.countByStatus(),
        componentRepository.count(),
        orderRepository.count(),
        orderRepository.count({ status: 'paid' }),
        orderRepository.totalRevenue()
      ]);

    return {
      userCount,
      suppliers: suppliersByStatus, // { pending, approved, rejected }
      componentCount,
      orderCount,
      paidOrderCount,
      totalRevenue: revenue         // CA des commandes payées
    };
  }
};

module.exports = adminService;

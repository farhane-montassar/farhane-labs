const Supplier = require('../models/Supplier');

// Repository Supplier : centralise l'accès Mongoose lié aux fournisseurs.
// Utilisé ici surtout pour l'autorisation (retrouver le Supplier d'un user).
const supplierRepository = {
  // Profil Supplier rattaché à un utilisateur (1 user supplier ↔ 1 Supplier).
  findByUser(userId) {
    return Supplier.findOne({ user: userId });
  },

  findById(id) {
    return Supplier.findById(id);
  },

  // Tous les fournisseurs (dashboard admin), avec le compte user associé.
  // Filtre optionnel par statut (pending/approved/rejected).
  findAll(filter = {}) {
    return Supplier.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt');
  },

  // Met à jour le statut d'un fournisseur (approve/reject par l'admin).
  updateStatus(id, status) {
    return Supplier.findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true })
      .populate('user', 'name email');
  },

  // Répartition du nombre de fournisseurs par statut (stats admin).
  // Renvoie { pending, approved, rejected }.
  async countByStatus() {
    const rows = await Supplier.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) {
      if (r._id in counts) counts[r._id] = r.count;
    }
    return counts;
  }
};

module.exports = supplierRepository;

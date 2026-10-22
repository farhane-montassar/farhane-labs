const Kit = require('../models/Kit');

// Repository Kit : centralise TOUT l'accès Mongoose aux kits (configs sauvegardées).
const kitRepository = {
  create(data) {
    return Kit.create(data);
  },

  // Kits d'un propriétaire donné (configs sauvegardées par un utilisateur).
  findByOwner(ownerId) {
    return Kit.find({ owner: ownerId })
      .populate('board', 'name category price')
      .populate('components.component', 'name category price')
      .sort('-createdAt');
  },

  findById(id) {
    return Kit.findById(id)
      .populate('board', 'name category price')
      .populate('components.component', 'name category price');
  }
};

module.exports = kitRepository;

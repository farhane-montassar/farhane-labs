const User = require('../models/User');

// Repository User : centralise TOUT l'accès Mongoose lié aux utilisateurs.
// Aucune autre couche (service/controller) ne doit appeler User.xxx directement.
const userRepository = {
  // Recherche par email. `withPassword` ré-inclut le champ password
  // (exclu par défaut via select:false) pour la vérification au login.
  findByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email });
    if (withPassword) query.select('+password');
    return query;
  },

  findById(id) {
    return User.findById(id);
  },

  create(data) {
    return User.create(data);
  },

  // Tous les utilisateurs (dashboard admin), les plus récents d'abord.
  // Le password est exclu par défaut (select:false dans le modèle).
  // Filtre optionnel par rôle (client/supplier/admin).
  findAll(filter = {}) {
    return User.find(filter).sort('-createdAt');
  },

  // Nombre total d'utilisateurs (filtre optionnel, ex. { role: 'client' }).
  count(filter = {}) {
    return User.countDocuments(filter);
  }
};

module.exports = userRepository;

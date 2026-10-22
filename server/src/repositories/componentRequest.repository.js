const ComponentRequest = require('../models/ComponentRequest');

// Repository ComponentRequest : centralise TOUT l'accès Mongoose aux demandes.
const componentRequestRepository = {
  create(data) {
    return ComponentRequest.create(data);
  },

  // Mes demandes (client), les plus récentes d'abord, avec le composant lié si satisfait.
  findByClient(clientId) {
    return ComponentRequest.find({ client: clientId })
      .populate('fulfilledComponent', 'name category price')
      .sort('-createdAt');
  },

  // Demandes à traiter (supplier/admin). Filtre optionnel par statut.
  findAll(filter = {}) {
    return ComponentRequest.find(filter)
      .populate('client', 'name email')
      .populate('fulfilledComponent', 'name category price')
      .sort('-createdAt');
  },

  findById(id) {
    return ComponentRequest.findById(id);
  },

  // Lie la demande à un composant et la marque satisfaite.
  markFulfilled(id, componentId) {
    return ComponentRequest.findByIdAndUpdate(
      id,
      { status: 'fulfilled', fulfilledComponent: componentId },
      { new: true, runValidators: true }
    )
      .populate('client', 'name email')
      .populate('fulfilledComponent', 'name category price');
  }
};

module.exports = componentRequestRepository;

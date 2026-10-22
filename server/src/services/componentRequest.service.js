const componentRequestRepository = require('../repositories/componentRequest.repository');
const componentRepository = require('../repositories/component.repository');
const supplierRepository = require('../repositories/supplier.repository');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');

// Service ComponentRequest : orchestre les demandes de composant ET les notifications
// associées (réutilise notificationService.createNotification — pas de système parallèle).
const componentRequestService = {
  // CLIENT — crée une demande puis notifie tous les fournisseurs APPROUVÉS.
  async create(user, { componentName, description }) {
    const request = await componentRequestRepository.create({
      client: user.id,
      componentName,
      description
    });

    // Destinataires : les users des fournisseurs approuvés.
    const approved = await supplierRepository.findAll({ status: 'approved' });
    await Promise.all(
      approved
        .filter((s) => s.user) // garde-fou si le user a été supprimé
        .map((s) =>
          notificationService.createNotification(s.user._id, {
            type: 'component_request',
            title: 'Nouvelle demande de composant',
            message: `Un client recherche « ${componentName} ». Vous pouvez l'ajouter au catalogue.`,
            link: '/fournisseur?tab=requests',
            data: { requestId: request._id }
          })
        )
    );

    return request;
  },

  // CLIENT — mes demandes + leur statut.
  async listMine(user) {
    return componentRequestRepository.findByClient(user.id);
  },

  // SUPPLIER/ADMIN — les demandes à traiter (filtre statut optionnel).
  async listAll({ status } = {}) {
    const filter = status ? { status } : {};
    return componentRequestRepository.findAll(filter);
  },

  // SUPPLIER/ADMIN — satisfait une demande en la liant à un composant existant,
  // puis notifie le client demandeur que le composant est disponible.
  async fulfill(user, id, { componentId }) {
    const component = await componentRepository.findById(componentId);
    if (!component) {
      throw new ApiError(404, 'Composant à lier introuvable');
    }

    const request = await componentRequestRepository.findById(id);
    if (!request) {
      throw new ApiError(404, 'Demande introuvable');
    }
    if (request.status === 'fulfilled') {
      throw new ApiError(400, 'Cette demande est déjà satisfaite');
    }

    const updated = await componentRequestRepository.markFulfilled(id, componentId);

    await notificationService.createNotification(request.client, {
      type: 'component_available',
      title: 'Le composant que vous cherchiez est disponible',
      message: `Votre demande « ${request.componentName} » a été satisfaite : « ${component.name} » est désormais au catalogue.`,
      link: `/components/${component._id}`,
      data: { requestId: request._id, componentId: component._id }
    });

    return updated;
  }
};

module.exports = componentRequestService;

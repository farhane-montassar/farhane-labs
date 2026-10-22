const kitRepository = require('../repositories/kit.repository');
const configuratorService = require('./configurator.service');

// Service Kit : sauvegarde d'une configuration validée.
//
// On NE refait pas confiance au client : on relance la validation complète
// (qui recharge les composants réels, vérifie le board, calcule prix + statut)
// puis on persiste le statut et le prix renvoyés par le moteur. Ainsi le Kit
// stocké reflète toujours l'état réel de la base au moment de la sauvegarde.
const kitService = {
  // user : { id, role } issu du token. body : { name, boardId, items: [...] }
  async create(user, { name, boardId, items }) {
    // Valide d'abord (lève 404/400 si board/composants invalides).
    const { status, totalPrice } = await configuratorService.validate({ boardId, items });

    const kit = await kitRepository.create({
      name,
      owner: user.id,
      board: boardId,
      components: items.map((it) => ({
        component: it.componentId,
        quantity: it.quantity && it.quantity > 0 ? it.quantity : 1
      })),
      totalPrice,
      compatibilityStatus: status,
      isPrebuilt: false
    });

    return kitRepository.findById(kit._id);
  },

  // Les kits de l'utilisateur connecté.
  async listMine(user) {
    return kitRepository.findByOwner(user.id);
  }
};

module.exports = kitService;

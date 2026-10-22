const componentService = require('../services/component.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const componentController = {
  // GET /api/components — liste publique (recherche, filtres, tri, pagination)
  list: asyncHandler(async (req, res) => {
    const data = await componentService.list(req.query);
    sendResponse(res, { statusCode: 200, data, message: 'Liste des composants' });
  }),

  // GET /api/components/:id — détail public
  getById: asyncHandler(async (req, res) => {
    const data = await componentService.getById(req.params.id);
    sendResponse(res, { statusCode: 200, data, message: 'Détail du composant' });
  }),

  // POST /api/components — fournisseur approuvé ou admin
  create: asyncHandler(async (req, res) => {
    const data = await componentService.create(req.user, req.body);
    sendResponse(res, { statusCode: 201, data, message: 'Composant créé' });
  }),

  // PUT /api/components/:id — propriétaire ou admin
  update: asyncHandler(async (req, res) => {
    const data = await componentService.update(req.user, req.params.id, req.body);
    sendResponse(res, { statusCode: 200, data, message: 'Composant mis à jour' });
  }),

  // DELETE /api/components/:id — propriétaire ou admin
  remove: asyncHandler(async (req, res) => {
    const data = await componentService.remove(req.user, req.params.id);
    sendResponse(res, { statusCode: 200, data, message: 'Composant supprimé' });
  })
};

module.exports = componentController;

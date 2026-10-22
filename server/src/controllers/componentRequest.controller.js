const componentRequestService = require('../services/componentRequest.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const componentRequestController = {
  // POST /api/component-requests — client crée une demande.
  create: asyncHandler(async (req, res) => {
    const data = await componentRequestService.create(req.user, req.body);
    sendResponse(res, { statusCode: 201, data, message: 'Demande enregistrée' });
  }),

  // GET /api/component-requests/me — mes demandes (client).
  listMine: asyncHandler(async (req, res) => {
    const data = await componentRequestService.listMine(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Mes demandes' });
  }),

  // GET /api/component-requests — demandes à traiter (supplier/admin), filtre ?status=.
  listAll: asyncHandler(async (req, res) => {
    const data = await componentRequestService.listAll({ status: req.query.status });
    sendResponse(res, { statusCode: 200, data, message: 'Demandes de composants' });
  }),

  // PATCH /api/component-requests/:id/fulfill — lier à un composant (supplier/admin).
  fulfill: asyncHandler(async (req, res) => {
    const data = await componentRequestService.fulfill(req.user, req.params.id, req.body);
    sendResponse(res, { statusCode: 200, data, message: 'Demande satisfaite' });
  })
};

module.exports = componentRequestController;

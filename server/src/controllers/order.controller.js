const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const orderController = {
  // POST /api/orders — crée une commande (client)
  create: asyncHandler(async (req, res) => {
    const data = await orderService.create(req.user, req.body);
    sendResponse(res, { statusCode: 201, data, message: 'Commande créée' });
  }),

  // GET /api/orders/me — les commandes du client connecté
  listMine: asyncHandler(async (req, res) => {
    const data = await orderService.listMine(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Mes commandes' });
  }),

  // GET /api/orders/:id — détail (propriétaire ou admin)
  getById: asyncHandler(async (req, res) => {
    const data = await orderService.getById(req.user, req.params.id);
    sendResponse(res, { statusCode: 200, data, message: 'Détail de la commande' });
  }),

  // PATCH /api/orders/:id/cancel — annule une commande (propriétaire ou admin)
  cancel: asyncHandler(async (req, res) => {
    const data = await orderService.cancel(req.user, req.params.id);
    sendResponse(res, { statusCode: 200, data, message: 'Commande annulée' });
  })
};

module.exports = orderController;

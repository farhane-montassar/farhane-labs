const supplierService = require('../services/supplier.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const supplierController = {
  // GET /api/supplier/components — ses composants
  listComponents: asyncHandler(async (req, res) => {
    const data = await supplierService.listComponents(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Mes composants' });
  }),

  // GET /api/supplier/orders — les commandes contenant ses composants
  listOrders: asyncHandler(async (req, res) => {
    const data = await supplierService.listOrders(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Mes commandes' });
  }),

  // GET /api/supplier/stats — statistiques du fournisseur
  stats: asyncHandler(async (req, res) => {
    const data = await supplierService.stats(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Mes statistiques' });
  })
};

module.exports = supplierController;

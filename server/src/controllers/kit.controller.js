const kitService = require('../services/kit.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const kitController = {
  // POST /api/kits — sauvegarde une configuration en kit (owner = user du token).
  create: asyncHandler(async (req, res) => {
    const data = await kitService.create(req.user, req.body);
    sendResponse(res, { statusCode: 201, data, message: 'Kit enregistré' });
  }),

  // GET /api/kits — les kits de l'utilisateur connecté.
  listMine: asyncHandler(async (req, res) => {
    const data = await kitService.listMine(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Mes kits' });
  })
};

module.exports = kitController;

const configuratorService = require('../services/configurator.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const configuratorController = {
  // POST /api/configurator/validate — valide une configuration (carte + composants).
  validate: asyncHandler(async (req, res) => {
    const data = await configuratorService.validate(req.body);
    sendResponse(res, { statusCode: 200, data, message: 'Validation de la configuration' });
  })
};

module.exports = configuratorController;

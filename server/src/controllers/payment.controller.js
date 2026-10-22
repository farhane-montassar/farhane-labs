const paymentService = require('../services/payment.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const paymentController = {
  // POST /api/payment/create-intent — crée un PaymentIntent pour une commande
  createIntent: asyncHandler(async (req, res) => {
    const data = await paymentService.createIntent(req.user, req.body);
    sendResponse(res, { statusCode: 201, data, message: 'PaymentIntent créé' });
  }),

  // POST /api/payment/confirm — confirme le paiement et passe la commande en 'paid'
  confirm: asyncHandler(async (req, res) => {
    const { order, alreadyPaid } = await paymentService.confirm(req.user, req.body);
    sendResponse(res, {
      statusCode: 200,
      data: order,
      message: alreadyPaid ? 'Commande déjà payée' : 'Paiement confirmé, commande payée'
    });
  }),

  // POST /api/payment/simulate-edinar — finalise un paiement e-Dinar SIMULÉ (démo)
  simulateEdinar: asyncHandler(async (req, res) => {
    const { order, alreadyPaid } = await paymentService.simulateEdinar(req.user, req.body);
    sendResponse(res, {
      statusCode: 200,
      data: order,
      message: alreadyPaid ? 'Commande déjà payée' : 'Paiement e-Dinar simulé, commande payée'
    });
  })
};

module.exports = paymentController;

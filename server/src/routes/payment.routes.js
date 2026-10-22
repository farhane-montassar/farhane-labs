const express = require('express');

const paymentController = require('../controllers/payment.controller');
const { orderIdRules } = require('../validators/payment.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// Création d'un PaymentIntent pour une commande : authentifié, rôle client.
router.post('/create-intent', protect, authorize('client'), orderIdRules, validate, paymentController.createIntent);

// Confirmation du paiement : authentifié, rôle client.
router.post('/confirm', protect, authorize('client'), orderIdRules, validate, paymentController.confirm);

// Finalisation d'un paiement e-Dinar SIMULÉ (démo) : authentifié, rôle client.
// Le body ne contient QUE { orderId } (aucune donnée de carte ne transite ici).
router.post('/simulate-edinar', protect, authorize('client'), orderIdRules, validate, paymentController.simulateEdinar);

module.exports = router;

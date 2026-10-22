const express = require('express');

const orderController = require('../controllers/order.controller');
const { idParamRules, createRules } = require('../validators/order.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// Création d'une commande : authentifié, rôle client.
router.post('/', protect, authorize('client'), createRules, validate, orderController.create);

// Mes commandes : authentifié, rôle client.
router.get('/me', protect, authorize('client'), orderController.listMine);

// Détail : authentifié ; l'ownership (propriétaire OU admin) est vérifié dans le service.
router.get('/:id', protect, idParamRules, validate, orderController.getById);

// Annulation : client (le sien) ou admin. Ownership vérifié dans le service.
router.patch('/:id/cancel', protect, authorize('client', 'admin'), idParamRules, validate, orderController.cancel);

module.exports = router;

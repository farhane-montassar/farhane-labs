const express = require('express');

const componentRequestController = require('../controllers/componentRequest.controller');
const { createRules, fulfillRules } = require('../validators/componentRequest.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// Toutes les routes sont authentifiées.
router.use(protect);

// CLIENT — créer une demande / voir mes demandes.
router.post('/', authorize('client'), createRules, validate, componentRequestController.create);
router.get('/me', authorize('client'), componentRequestController.listMine);

// SUPPLIER/ADMIN — voir les demandes à traiter / en satisfaire une.
router.get('/', authorize('supplier', 'admin'), componentRequestController.listAll);
router.patch('/:id/fulfill', authorize('supplier', 'admin'), fulfillRules, validate, componentRequestController.fulfill);

module.exports = router;

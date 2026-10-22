const express = require('express');

const supplierController = require('../controllers/supplier.controller');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// Dashboard fournisseur : réservé au rôle supplier (approbation vérifiée dans le
// service). Toutes les données sont filtrées par le Supplier déduit du token.
router.use(protect, authorize('supplier'));

router.get('/components', supplierController.listComponents);
router.get('/orders', supplierController.listOrders);
router.get('/stats', supplierController.stats);

module.exports = router;

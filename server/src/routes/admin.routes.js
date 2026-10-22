const express = require('express');

const adminController = require('../controllers/admin.controller');
const { supplierIdParamRules } = require('../validators/admin.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// Dashboard admin : toutes les routes réservées au rôle admin.
router.use(protect, authorize('admin'));

// Fournisseurs : liste + validation/refus.
router.get('/suppliers', adminController.listSuppliers);
router.patch('/suppliers/:id/approve', supplierIdParamRules, validate, adminController.approveSupplier);
router.patch('/suppliers/:id/reject', supplierIdParamRules, validate, adminController.rejectSupplier);

// Utilisateurs, commandes, statistiques.
router.get('/users', adminController.listUsers);
router.get('/orders', adminController.listOrders);
router.get('/stats', adminController.stats);

module.exports = router;

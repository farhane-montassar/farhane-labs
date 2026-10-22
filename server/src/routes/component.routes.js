const express = require('express');

const componentController = require('../controllers/component.controller');
const reviewController = require('../controllers/review.controller');
const { idParamRules, createRules, updateRules } = require('../validators/component.validator');
const { createRules: reviewCreateRules } = require('../validators/review.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// --- Routes publiques ---
router.get('/', componentController.list);
router.get('/:id', idParamRules, validate, componentController.getById);

// --- Avis d'un composant (routes imbriquées) ---
// Liste publique des avis du composant.
router.get('/:id/reviews', idParamRules, validate, reviewController.listByComponent);

// Laisser un avis : client uniquement (le service exige un achat réel).
router.post(
  '/:id/reviews',
  protect,
  authorize('client'),
  reviewCreateRules,
  validate,
  reviewController.create
);

// --- Routes protégées ---
// Création : fournisseur ou admin (le service vérifie l'approbation du fournisseur).
router.post(
  '/',
  protect,
  authorize('supplier', 'admin'),
  createRules,
  validate,
  componentController.create
);

// Modification : authentifié ; le service vérifie l'ownership (propriétaire ou admin).
router.put(
  '/:id',
  protect,
  authorize('supplier', 'admin'),
  updateRules,
  validate,
  componentController.update
);

// Suppression : authentifié ; le service vérifie l'ownership (propriétaire ou admin).
router.delete(
  '/:id',
  protect,
  authorize('supplier', 'admin'),
  idParamRules,
  validate,
  componentController.remove
);

module.exports = router;

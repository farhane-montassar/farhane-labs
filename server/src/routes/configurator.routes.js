const express = require('express');

const configuratorController = require('../controllers/configurator.controller');
const { validateRules } = require('../validators/configurator.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');

const router = express.Router();

// Validation d'une configuration — authentifié (tout rôle connecté).
// Le client envoie des identifiants ; le service recharge les vrais composants.
router.post(
  '/validate',
  protect,
  validateRules,
  validate,
  configuratorController.validate
);

module.exports = router;

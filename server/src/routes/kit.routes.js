const express = require('express');

const kitController = require('../controllers/kit.controller');
const { createRules } = require('../validators/kit.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// Sauvegarde d'une config : authentifié, rôle client.
router.post(
  '/',
  protect,
  authorize('client'),
  createRules,
  validate,
  kitController.create
);

// Liste de mes kits : authentifié (tout rôle), filtrée sur le owner du token.
router.get('/', protect, kitController.listMine);

module.exports = router;

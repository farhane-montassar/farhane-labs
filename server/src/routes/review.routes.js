const express = require('express');

const reviewController = require('../controllers/review.controller');
const { idParamRules, updateRules } = require('../validators/review.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');

const router = express.Router();

// Les routes imbriquées (POST/GET /api/components/:id/reviews) sont montées
// dans component.routes.js. Ce routeur ne gère que les avis par leur propre id.

// Modification : authentifié ; le service vérifie l'ownership (auteur ou admin).
router.put('/:id', protect, updateRules, validate, reviewController.update);

// Suppression : authentifié ; le service vérifie l'ownership (auteur ou admin).
router.delete('/:id', protect, idParamRules, validate, reviewController.remove);

module.exports = router;

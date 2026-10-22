const { body, param } = require('express-validator');

// Validation de l'identifiant de route (:id) → 400 propre au lieu d'un CastError.
const idParamRules = [
  param('id').isMongoId().withMessage('Identifiant invalide')
];

// Création : rating obligatoire (1-5), comment optionnel.
const createRules = [
  ...idParamRules, // :id = composant noté
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating doit être un entier entre 1 et 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('comment ne doit pas dépasser 1000 caractères')
];

// Modification : tous les champs optionnels (mise à jour partielle).
const updateRules = [
  ...idParamRules, // :id = avis
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating doit être un entier entre 1 et 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('comment ne doit pas dépasser 1000 caractères')
];

module.exports = { idParamRules, createRules, updateRules };

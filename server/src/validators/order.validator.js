const { body, param } = require('express-validator');

// Validation de l'id de route (:id) → 400 propre au lieu d'un CastError.
const idParamRules = [
  param('id').isMongoId().withMessage('Identifiant de commande invalide')
];

// Création d'une commande : items (ids + quantités) + adresse de livraison.
// On valide la FORME ; le prix/stock/cohérence sont gérés par le service.
const createRules = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('items doit être un tableau non vide'),
  body('items.*.componentId')
    .isMongoId()
    .withMessage('Chaque item doit avoir un componentId valide'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('quantity doit être un entier ≥ 1'),

  body('shippingAddress').isObject().withMessage('shippingAddress est requise'),
  body('shippingAddress.street').trim().notEmpty().withMessage('La rue est requise'),
  body('shippingAddress.city').trim().notEmpty().withMessage('La ville est requise'),
  body('shippingAddress.zip').trim().notEmpty().withMessage('Le code postal est requis'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Le pays est requis'),
  // Téléphone tunisien : indicatif +216 suivi de 8 chiffres (format compact).
  body('shippingAddress.phone')
    .trim()
    .matches(/^\+216\d{8}$/)
    .withMessage('Le téléphone doit être au format tunisien : +216 suivi de 8 chiffres'),

  // Optionnel pour rétrocompatibilité : absent → 'card' (défaut côté service/modèle).
  body('paymentMethod')
    .optional()
    .isIn(['card', 'cod', 'edinar'])
    .withMessage("paymentMethod doit être 'card', 'cod' ou 'edinar'")
];

module.exports = { idParamRules, createRules };

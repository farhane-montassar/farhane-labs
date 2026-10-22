const { body } = require('express-validator');

// Validation du body de POST /api/configurator/validate.
// On valide la FORME (ids bien formés, quantités entières) ; la cohérence
// métier (board réel, composants existants) est vérifiée dans le service.
const validateRules = [
  body('boardId').isMongoId().withMessage('boardId invalide'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('items doit être un tableau non vide'),

  body('items.*.componentId')
    .isMongoId()
    .withMessage('Chaque item doit avoir un componentId valide'),

  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('quantity doit être un entier ≥ 1')
];

module.exports = { validateRules };

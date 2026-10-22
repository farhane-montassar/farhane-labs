const { body } = require('express-validator');

// Validation du body de POST /api/kits.
// Même forme que le configurateur, plus un `name` obligatoire.
const createRules = [
  body('name').trim().notEmpty().withMessage('Le nom du kit est requis'),
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

module.exports = { createRules };

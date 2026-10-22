const { body, param } = require('express-validator');

// POST /api/component-requests — création d'une demande par un client.
const createRules = [
  body('componentName').trim().notEmpty().withMessage('Le nom du composant souhaité est requis'),
  body('description').optional().trim()
];

// PATCH /api/component-requests/:id/fulfill — liaison à un composant existant.
const fulfillRules = [
  param('id').isMongoId().withMessage('id de demande invalide'),
  body('componentId').isMongoId().withMessage('componentId invalide')
];

module.exports = { createRules, fulfillRules };

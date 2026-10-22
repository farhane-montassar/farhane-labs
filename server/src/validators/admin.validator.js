const { param } = require('express-validator');

// Validation de l'identifiant de fournisseur (:id) → 400 propre au lieu d'un CastError.
const supplierIdParamRules = [
  param('id').isMongoId().withMessage('Identifiant de fournisseur invalide')
];

module.exports = { supplierIdParamRules };

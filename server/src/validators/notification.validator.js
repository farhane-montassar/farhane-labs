const { param } = require('express-validator');

// Validation de l'id de notification dans l'URL (PATCH /:id/read).
const idParam = [
  param('id').isMongoId().withMessage('id de notification invalide')
];

module.exports = { idParam };

const { validationResult } = require('express-validator');

// Middleware générique : exécute après les règles express-validator.
// S'il y a des erreurs de validation, renvoie un 400 normalisé
// au lieu de laisser la requête atteindre le controller.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const message = errors.array().map((e) => e.msg).join(', ');
  return res.status(400).json({ success: false, data: null, message });
}

module.exports = validate;

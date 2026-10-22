const { body } = require('express-validator');

// Règles de validation des entrées d'authentification.
// Elles s'exécutent avant le controller ; le middleware `validate`
// transforme leurs erreurs en réponse 400 normalisée.

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis'),
  body('email')
    .trim()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères')
];

const loginRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
];

module.exports = { registerRules, loginRules };

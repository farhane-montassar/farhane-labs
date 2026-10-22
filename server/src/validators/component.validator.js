const { body, param } = require('express-validator');

// Valeurs autorisées (alignées sur le schéma Component).
const CATEGORIES = ['board', 'sensor', 'module', 'accessory', 'display', 'motor', 'power'];
const INTERFACES = ['I2C', 'SPI', 'UART', 'analog', 'digital', 'power', 'PWM', 'driver', 'USB', 'wireless'];

// Validation de l'identifiant de route (:id) → 400 propre au lieu d'un CastError.
const idParamRules = [
  param('id').isMongoId().withMessage('Identifiant de composant invalide')
];

// Sous-règles communes aux specs (toujours optionnelles).
const specsRules = [
  body('specs.voltage').optional().isFloat({ min: 0 }).withMessage('voltage doit être un nombre positif'),
  body('specs.voltageMin').optional().isFloat({ min: 0 }).withMessage('voltageMin doit être un nombre positif'),
  body('specs.voltageMax').optional().isFloat({ min: 0 }).withMessage('voltageMax doit être un nombre positif'),
  body('specs.interface').optional().isIn(INTERFACES).withMessage(`interface invalide (${INTERFACES.join(', ')})`),
  body('specs.pinsUsed').optional().isInt({ min: 0 }).withMessage('pinsUsed doit être un entier positif'),
  body('specs.notes').optional().isString().withMessage('notes doit être une chaîne'),
  body('specs.requiresDriver').optional().isBoolean().withMessage('requiresDriver doit être un booléen'),
  body('specs.isDriver').optional().isBoolean().withMessage('isDriver doit être un booléen'),
  body('specs.isPowerSupply').optional().isBoolean().withMessage('isPowerSupply doit être un booléen'),
  body('specs.requiresExternalPower').optional().isBoolean().withMessage('requiresExternalPower doit être un booléen'),
  body('specs.powerOutput.voltage').optional().isFloat({ min: 0 }).withMessage('powerOutput.voltage doit être un nombre positif'),
  body('specs.powerOutput.currentA').optional().isFloat({ min: 0 }).withMessage('powerOutput.currentA doit être un nombre positif')
];

// Création : champs obligatoires + types.
const createRules = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('category').isIn(CATEGORIES).withMessage(`category invalide (${CATEGORIES.join(', ')})`),
  body('price').isFloat({ min: 0 }).withMessage('price doit être un nombre positif'),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock doit être un entier positif'),
  body('images').optional().isArray().withMessage('images doit être un tableau'),
  // supplierId : utile uniquement quand un admin crée ; le service en impose la présence.
  body('supplierId').optional().isMongoId().withMessage('supplierId invalide'),
  ...specsRules
];

// Modification : tous les champs deviennent optionnels (mise à jour partielle).
const updateRules = [
  ...idParamRules,
  body('name').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('category').optional().isIn(CATEGORIES).withMessage(`category invalide (${CATEGORIES.join(', ')})`),
  body('price').optional().isFloat({ min: 0 }).withMessage('price doit être un nombre positif'),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock doit être un entier positif'),
  body('images').optional().isArray().withMessage('images doit être un tableau'),
  ...specsRules
];

module.exports = { idParamRules, createRules, updateRules };

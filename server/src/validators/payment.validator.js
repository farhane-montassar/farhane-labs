const { body } = require('express-validator');

// Les deux routes paiement ciblent une commande par son id.
const orderIdRules = [
  body('orderId').isMongoId().withMessage('orderId invalide')
];

module.exports = { orderIdRules };

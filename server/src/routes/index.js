const express = require('express');

const router = express.Router();

// Vérification rapide que l'API tourne.
router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'up' }, message: 'API opérationnelle' });
});

// Sous-routeurs de l'API.
router.use('/auth', require('./auth.routes'));
router.use('/components', require('./component.routes'));
router.use('/configurator', require('./configurator.routes'));
router.use('/kits', require('./kit.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/component-requests', require('./componentRequest.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payment', require('./payment.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/supplier', require('./supplier.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;

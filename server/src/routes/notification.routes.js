const express = require('express');

const notificationController = require('../controllers/notification.controller');
const { idParam } = require('../validators/notification.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');

const router = express.Router();

// Toutes les routes sont authentifiées et cloisonnées sur l'utilisateur du token.
router.use(protect);

// Mes notifications (récentes d'abord) + compte des non-lues.
router.get('/', notificationController.listMine);

// Compte des non-lues seulement (léger, pour le polling de la cloche).
router.get('/unread-count', notificationController.unreadCount);

// Tout marquer comme lu. Déclaré AVANT '/:id/read' (chemin sans paramètre).
router.patch('/read-all', notificationController.markAllRead);

// Marquer UNE notif comme lue (ownership vérifié côté service/repository).
router.patch('/:id/read', idParam, validate, notificationController.markRead);

module.exports = router;

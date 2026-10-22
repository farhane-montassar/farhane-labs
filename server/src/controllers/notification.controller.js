const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const notificationController = {
  // GET /api/notifications — mes notifications récentes + compte des non-lues.
  listMine: asyncHandler(async (req, res) => {
    const data = await notificationService.listForUser(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Mes notifications' });
  }),

  // GET /api/notifications/unread-count — léger, pour le polling de la cloche.
  unreadCount: asyncHandler(async (req, res) => {
    const data = await notificationService.getUnreadCount(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Notifications non lues' });
  }),

  // PATCH /api/notifications/read-all — tout marquer comme lu.
  markAllRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markAllRead(req.user);
    sendResponse(res, { statusCode: 200, data, message: 'Toutes les notifications sont lues' });
  }),

  // PATCH /api/notifications/:id/read — marquer une notif comme lue (ownership).
  markRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markRead(req.user, req.params.id);
    sendResponse(res, { statusCode: 200, data, message: 'Notification marquée comme lue' });
  })
};

module.exports = notificationController;

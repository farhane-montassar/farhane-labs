const notificationRepository = require('../repositories/notification.repository');
const ApiError = require('../utils/ApiError');

// Service Notification : logique métier + helper de création réutilisable.
const notificationService = {
  // Helper INTERNE réutilisable : à appeler depuis n'importe quelle partie du code
  // (changement de statut de commande, demande de composant, etc.) pour notifier un
  // utilisateur. Volontairement permissif : type par défaut 'info'.
  createNotification(userId, { type = 'info', title, message, link, data } = {}) {
    return notificationRepository.create({ user: userId, type, title, message, link, data });
  },

  // Mes notifications + le compte des non-lues (une seule réponse pour le panneau).
  async listForUser(user) {
    const [items, unreadCount] = await Promise.all([
      notificationRepository.findByUser(user.id),
      notificationRepository.countUnread(user.id)
    ]);
    return { items, unreadCount };
  },

  // Juste le compte des non-lues (léger, pour le polling de la cloche).
  async getUnreadCount(user) {
    const unreadCount = await notificationRepository.countUnread(user.id);
    return { unreadCount };
  },

  // Marque une notif comme lue (ownership vérifié dans le repository).
  async markRead(user, id) {
    const notification = await notificationRepository.markRead(id, user.id);
    if (!notification) {
      throw new ApiError(404, 'Notification introuvable');
    }
    return notification;
  },

  // Marque toutes mes non-lues comme lues.
  async markAllRead(user) {
    const result = await notificationRepository.markAllRead(user.id);
    return { modified: result.modifiedCount || 0 };
  }
};

module.exports = notificationService;

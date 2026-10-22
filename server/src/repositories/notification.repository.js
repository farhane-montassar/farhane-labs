const Notification = require('../models/Notification');

// Repository Notification : centralise TOUT l'accès Mongoose aux notifications.
// L'ownership (user) est toujours porté par le filtre des requêtes de lecture/écriture.
const notificationRepository = {
  create(data) {
    return Notification.create(data);
  },

  // Mes notifications, les plus récentes d'abord (limite raisonnable pour le panneau).
  findByUser(userId) {
    return Notification.find({ user: userId }).sort('-createdAt').limit(50);
  },

  // Nombre de non-lues — requête légère pour le polling de la cloche.
  countUnread(userId) {
    return Notification.countDocuments({ user: userId, read: false });
  },

  // Marque UNE notif comme lue. L'ownership est dans le filtre : un user ne peut
  // toucher qu'à ses propres notifications. Renvoie null si introuvable/pas à lui.
  markRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true }
    );
  },

  // Marque toutes mes non-lues comme lues. Renvoie le résultat updateMany.
  markAllRead(userId) {
    return Notification.updateMany({ user: userId, read: false }, { read: true });
  }
};

module.exports = notificationRepository;

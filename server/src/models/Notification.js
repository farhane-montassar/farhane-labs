const mongoose = require('mongoose');

// Notification destinée à UN utilisateur. Infrastructure générique : d'autres parties
// du code (changement de statut de commande, demandes de composant…) créent des
// notifications via notificationService.createNotification(...).
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:    { type: String, enum: ['info', 'order', 'supplier', 'component_request', 'component_available'], default: 'info' },
  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  link:    { type: String },                          // optionnel : page vers laquelle pointer
  data:    { type: mongoose.Schema.Types.Mixed }      // charge utile libre (ids, etc.)
}, { timestamps: true });

// Liste « mes notifications, les plus récentes d'abord » → index user + date.
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

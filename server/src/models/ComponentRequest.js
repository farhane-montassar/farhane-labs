const mongoose = require('mongoose');

// Demande d'un client pour un composant ABSENT du catalogue. Les fournisseurs approuvés
// sont notifiés à la création ; le client est notifié quand sa demande est satisfaite
// (liée à un composant disponible).
const componentRequestSchema = new mongoose.Schema({
  client:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  componentName: { type: String, required: true, trim: true },
  description:   { type: String },
  status:        { type: String, enum: ['pending', 'fulfilled', 'closed'], default: 'pending', index: true },
  // Composant qui satisfait la demande (renseigné au moment du fulfill).
  fulfilledComponent: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' }
}, { timestamps: true });

module.exports = mongoose.model('ComponentRequest', componentRequestSchema);

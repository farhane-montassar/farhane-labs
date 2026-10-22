const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
    supplier:  { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    name:      { type: String, required: true },     // figé au moment de l'achat
    price:     { type: Number, required: true },     // figé au moment de l'achat
    quantity:  { type: Number, required: true, min: 1 }
  }],
  totalAmount:     { type: Number, required: true },
  // Frais de livraison FIGÉS sur la commande (0 pour carte, 3 TND pour COD).
  // Calculés côté serveur et déjà inclus dans totalAmount.
  shippingFee:     { type: Number, default: 0 },
  // Méthode de paiement choisie au checkout. 'card' = Stripe (défaut, rétrocompat
  // des anciennes commandes), 'cod' = paiement à la livraison (cash on delivery),
  // 'edinar' = carte tunisienne / e-Dinar (paiement EN LIGNE SIMULÉ, démo — pas de
  // passerelle bancaire réelle ; finalisé via /api/payment/simulate-edinar).
  paymentMethod:   { type: String, enum: ['card', 'cod', 'edinar'], default: 'card' },
  // États : pending (carte, en attente de paiement) / pending_cod (COD, stock
  // réservé, à payer à la livraison) / paid / shipped / delivered / cancelled.
  status:          { type: String, enum: ['pending', 'pending_cod', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  // True dès qu'une commande a décrémenté du stock (COD à la création, carte au
  // paiement). Pivot d'idempotence : le réincrément à l'annulation ne s'applique
  // qu'aux commandes encore `stockReserved`, et le remet à false une fois fait.
  stockReserved:   { type: Boolean, default: false },
  paymentIntentId: { type: String },
  shippingAddress: {
    street: String, city: String, zip: String, country: String,
    // Téléphone du destinataire pour la livraison, format tunisien compact
    // « +216 » + 8 chiffres (ex. '+21612345678'). Validé côté order.validator.
    phone: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

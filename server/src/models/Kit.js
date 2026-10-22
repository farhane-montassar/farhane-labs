const mongoose = require('mongoose');

const kitSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },        // null si pré-fait
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  components: [{
    component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
    quantity:  { type: Number, default: 1, min: 1 }
  }],
  totalPrice:          { type: Number, default: 0 },
  isPrebuilt:          { type: Boolean, default: false },
  compatibilityStatus: { type: String, enum: ['compatible', 'compatible_adaptation', 'incompatible'], default: 'compatible' }
}, { timestamps: true });

module.exports = mongoose.model('Kit', kitSchema);

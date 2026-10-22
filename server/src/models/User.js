const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['client', 'supplier', 'admin'], default: 'client' },
  address: {
    street: String, city: String, zip: String, country: String
  }
}, { timestamps: true });

// Hachage automatique du mot de passe avant sauvegarde.
// Mongoose 9 : les middlewares async signalent la fin via la promesse
// (plus de `next`). On `return` simplement pour court-circuiter.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Méthode de comparaison à la connexion
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);

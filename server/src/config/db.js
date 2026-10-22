const mongoose = require('mongoose');

// Connexion à MongoDB. En cas d'échec, on arrête le process :
// inutile de laisser tourner un serveur qui ne peut pas lire/écrire.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

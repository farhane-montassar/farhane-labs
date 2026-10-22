const jwt = require('jsonwebtoken');

// Signe un token contenant l'id et le rôle de l'utilisateur.
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d'
  });
}

// Vérifie un token et renvoie son payload décodé (lève si invalide/expiré).
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };

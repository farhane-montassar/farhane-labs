const ApiError = require('../utils/ApiError');

// Route inconnue → 404 normalisé.
function notFound(req, res, next) {
  next(new ApiError(404, `Route introuvable : ${req.method} ${req.originalUrl}`));
}

// Middleware d'erreurs CENTRALISÉ (doit être monté en dernier).
// Toute erreur (next(err) ou rejet de promesse via asyncHandler) arrive ici
// et repart au format normalisé { success, data, message }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur serveur';

  // --- Cas Mongoose fréquents, traduits en messages clairs ---

  // Doublon (ex. email déjà utilisé) → index unique violé
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    message = `Valeur déjà utilisée pour : ${field}`;
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // ObjectId malformé
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Identifiant invalide : ${err.value}`;
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  // En dev, on log la stack pour debugger ; on ne l'expose jamais au client.
  if (statusCode === 500) {
    console.error('💥', err);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message
  });
}

module.exports = { notFound, errorHandler };

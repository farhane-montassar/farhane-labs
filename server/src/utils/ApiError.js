// Erreur applicative portant un code HTTP.
// On la lève depuis les services/controllers ; le middleware d'erreurs
// la transforme ensuite en réponse normalisée.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // erreur "attendue" (vs bug imprévu)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

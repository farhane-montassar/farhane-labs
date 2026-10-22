// Wrapper pour les controllers asynchrones.
// Évite de répéter try/catch partout : toute promesse rejetée est
// transmise au middleware d'erreurs centralisé via next(err).
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

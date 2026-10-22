const ApiError = require('../utils/ApiError');

// Autorisation par rôle. À utiliser APRÈS le middleware `protect`
// (qui a rempli req.user). Ex. : router.get('/x', protect, authorize('admin'))
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Non authentifié'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Accès refusé : privilèges insuffisants'));
    }
    next();
  };
}

module.exports = authorize;

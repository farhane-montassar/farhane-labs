const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Protège une route : exige un header `Authorization: Bearer <token>` valide.
// En cas de succès, injecte { id, role } dans req.user pour les couches suivantes.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Non authentifié : token manquant');
  }

  const token = header.split(' ')[1];

  // verifyToken lève si invalide/expiré → capté par le middleware d'erreurs.
  const decoded = verifyToken(token);
  req.user = { id: decoded.id, role: decoded.role };

  next();
});

module.exports = protect;

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
// Aucune logique métier, aucun accès Mongoose ici.
const authController = {
  register: asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const data = await authService.register({ name, email, password });
    sendResponse(res, { statusCode: 201, data, message: 'Compte créé avec succès' });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await authService.login({ email, password });
    sendResponse(res, { statusCode: 200, data, message: 'Connexion réussie' });
  }),

  // Profil de l'utilisateur connecté (req.user injecté par le middleware auth).
  me: asyncHandler(async (req, res) => {
    const data = await authService.getProfile(req.user.id);
    sendResponse(res, { statusCode: 200, data, message: 'Profil récupéré' });
  }),

  // Route de démonstration réservée au rôle admin (test du middleware role).
  adminCheck: asyncHandler(async (req, res) => {
    sendResponse(res, {
      statusCode: 200,
      data: { user: req.user },
      message: 'Accès admin confirmé ✅'
    });
  })
};

module.exports = authController;

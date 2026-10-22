const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');

// Met en forme l'objet user renvoyé au client (jamais le mot de passe).
function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

const authService = {
  // Inscription. Le rôle est forcé à 'client' : on ne laisse pas le client
  // s'auto-attribuer 'admin'/'supplier' depuis le body.
  async register({ name, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ApiError(409, 'Un compte existe déjà avec cet email');
    }

    // Le hash du mot de passe est géré par le pre-save du modèle User.
    const user = await userRepository.create({ name, email, password, role: 'client' });

    const token = signToken({ id: user._id, role: user.role });
    return { user: toPublicUser(user), token };
  },

  // Connexion : vérifie l'email puis le mot de passe via matchPassword (modèle).
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, { withPassword: true });
    if (!user) {
      throw new ApiError(401, 'Email ou mot de passe incorrect');
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      throw new ApiError(401, 'Email ou mot de passe incorrect');
    }

    const token = signToken({ id: user._id, role: user.role });
    return { user: toPublicUser(user), token };
  },

  // Profil de l'utilisateur connecté (à partir de l'id du token).
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Utilisateur introuvable');
    }
    return toPublicUser(user);
  }
};

module.exports = authService;

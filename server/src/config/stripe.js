const Stripe = require('stripe');
const ApiError = require('../utils/ApiError');

// Initialisation du client Stripe à partir de STRIPE_SECRET_KEY (.env).
// Si la clé est absente, on NE PLANTE PAS le serveur : on garde `stripe = null`
// et toute tentative de paiement lèvera une erreur claire (503) via getStripe().
const secret = process.env.STRIPE_SECRET_KEY;
const stripe = secret ? new Stripe(secret) : null;

if (!stripe) {
  // Avertissement au démarrage, sans interrompre le reste de l'API.
  console.warn('⚠️ STRIPE_SECRET_KEY non configurée : les routes de paiement renverront une 503.');
}

// Renvoie le client Stripe ou lève une erreur opérationnelle si non configuré.
// À utiliser dans le service de paiement avant tout appel à l'API Stripe.
function getStripe() {
  if (!stripe) {
    throw new ApiError(503, 'Paiement indisponible : STRIPE_SECRET_KEY non configurée sur le serveur');
  }
  return stripe;
}

module.exports = { getStripe, isConfigured: () => Boolean(stripe) };

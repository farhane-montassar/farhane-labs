const reviewRepository = require('../repositories/review.repository');
const componentRepository = require('../repositories/component.repository');
const orderRepository = require('../repositories/order.repository');
const ApiError = require('../utils/ApiError');

// Service Review : logique métier des avis.
//
// RÈGLES :
// - Un client ne peut noter QUE un composant qu'il a réellement acheté
//   (commande 'paid' contenant ce composant).
// - Un seul avis par client et par composant (index unique du modèle) ;
//   le doublon est traduit en 409 clair, jamais en crash 500.
// - Modification/suppression réservées à l'auteur ou à un admin.
// - À chaque écriture, on recalcule ratingAverage/ratingCount du composant.

// Recalcule et persiste les notes agrégées du composant concerné.
async function refreshComponentRatings(componentId) {
  const ratings = await reviewRepository.aggregateRatings(componentId);
  await componentRepository.updateRatings(componentId, ratings);
}

// Vérifie qu'un user a le droit de modifier/supprimer un avis donné.
// Admin : toujours. Sinon : il faut être l'auteur de l'avis.
function assertOwnership(user, review) {
  if (user.role === 'admin') return;

  const authorId = review.user && review.user._id ? review.user._id : review.user;
  if (String(authorId) !== String(user.id)) {
    throw new ApiError(403, 'Accès refusé : cet avis ne vous appartient pas');
  }
}

const reviewService = {
  // Liste publique des avis d'un composant.
  async listByComponent(componentId) {
    const component = await componentRepository.findById(componentId);
    if (!component) {
      throw new ApiError(404, 'Composant introuvable');
    }
    return reviewRepository.findByComponent(componentId);
  },

  // Création d'un avis (client). user : { id, role }.
  async create(user, componentId, { rating, comment }) {
    const component = await componentRepository.findById(componentId);
    if (!component) {
      throw new ApiError(404, 'Composant introuvable');
    }

    // Avis conditionné à un achat réel (commande payée contenant ce composant).
    const hasPurchased = await orderRepository.existsPaidOrderWithComponent(user.id, componentId);
    if (!hasPurchased) {
      throw new ApiError(403, 'Vous ne pouvez noter que des composants que vous avez achetés');
    }

    let review;
    try {
      review = await reviewRepository.create({
        user: user.id,
        component: componentId,
        rating,
        comment
      });
    } catch (err) {
      // Index unique (user, component) violé → un avis existe déjà.
      if (err.code === 11000) {
        throw new ApiError(409, 'Vous avez déjà laissé un avis pour ce composant');
      }
      throw err;
    }

    await refreshComponentRatings(componentId);
    return reviewRepository.findById(review._id).populate('user', 'name');
  },

  // Modification d'un avis (auteur ou admin).
  async update(user, id, { rating, comment }) {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new ApiError(404, 'Avis introuvable');
    }

    assertOwnership(user, review);

    const data = {};
    if (rating !== undefined) data.rating = rating;
    if (comment !== undefined) data.comment = comment;

    const updated = await reviewRepository.updateById(id, data);
    await refreshComponentRatings(review.component);
    return updated;
  },

  // Suppression d'un avis (auteur ou admin).
  async remove(user, id) {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new ApiError(404, 'Avis introuvable');
    }

    assertOwnership(user, review);

    await reviewRepository.deleteById(id);
    await refreshComponentRatings(review.component);
    return { id };
  }
};

module.exports = reviewService;

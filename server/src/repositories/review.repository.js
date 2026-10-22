const mongoose = require('mongoose');
const Review = require('../models/Review');

// Repository Review : centralise TOUT l'accès Mongoose aux avis.
// Aucune requête Mongoose ne doit vivre ailleurs (service/controller).
const reviewRepository = {
  create(data) {
    return Review.create(data);
  },

  findById(id) {
    return Review.findById(id);
  },

  // Avis d'un composant, les plus récents d'abord, avec l'auteur peuplé.
  findByComponent(componentId) {
    return Review.find({ component: componentId })
      .populate('user', 'name')
      .sort('-createdAt');
  },

  updateById(id, data) {
    return Review.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
      .populate('user', 'name');
  },

  deleteById(id) {
    return Review.findByIdAndDelete(id);
  },

  // Recalcule la note moyenne et le nombre d'avis d'un composant via agrégation.
  // Renvoie { ratingAverage, ratingCount } ; { 0, 0 } s'il n'y a plus d'avis.
  async aggregateRatings(componentId) {
    const result = await Review.aggregate([
      { $match: { component: new mongoose.Types.ObjectId(componentId) } },
      {
        $group: {
          _id: '$component',
          ratingAverage: { $avg: '$rating' },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    if (!result.length) {
      return { ratingAverage: 0, ratingCount: 0 };
    }

    // Arrondi à une décimale pour un affichage propre (ex. 4.3).
    const { ratingAverage, ratingCount } = result[0];
    return { ratingAverage: Math.round(ratingAverage * 10) / 10, ratingCount };
  }
};

module.exports = reviewRepository;

const Component = require('../models/Component');

// Repository Component : centralise TOUT l'accès Mongoose aux composants.
// Aucune requête Mongoose ne doit vivre ailleurs (service/controller).
const componentRepository = {
  // Liste paginée + triée. `filter` est un objet de requête Mongoose déjà
  // construit par le service ; `sort/skip/limit` gèrent tri et pagination.
  find(filter = {}, { sort = '-createdAt', skip = 0, limit = 12 } = {}) {
    return Component.find(filter)
      .populate('supplier', 'companyName status')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },

  // Nombre total de documents correspondant au filtre (pour la pagination).
  count(filter = {}) {
    return Component.countDocuments(filter);
  },

  findById(id) {
    return Component.findById(id).populate('supplier', 'companyName status');
  },

  // Charge en une seule requête tous les composants dont l'id est dans `ids`.
  // Utilisé par le configurateur pour recharger les vrais composants depuis la
  // base (on ne fait jamais confiance aux specs envoyées par le client).
  findByIds(ids) {
    return Component.find({ _id: { $in: ids } }).populate('supplier', 'companyName status');
  },

  // Crée puis peuple `supplier` pour une réponse cohérente avec les autres routes.
  async create(data) {
    const component = await Component.create(data);
    return component.populate('supplier', 'companyName status');
  },

  // Mise à jour partielle. runValidators applique les règles du schéma.
  updateById(id, data) {
    return Component.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
      .populate('supplier', 'companyName status');
  },

  deleteById(id) {
    return Component.findByIdAndDelete(id);
  },

  // Met à jour la note moyenne et le nombre d'avis d'un composant.
  // Appelé par le service Review après chaque ajout/modif/suppression d'avis.
  updateRatings(id, { ratingAverage, ratingCount }) {
    return Component.findByIdAndUpdate(
      id,
      { ratingAverage, ratingCount },
      { returnDocument: 'after' }
    );
  },

  // Tous les composants d'un fournisseur (dashboard fournisseur), récents d'abord.
  findBySupplier(supplierId) {
    return Component.find({ supplier: supplierId }).sort('-createdAt');
  },

  // Nombre de composants d'un fournisseur.
  countBySupplier(supplierId) {
    return Component.countDocuments({ supplier: supplierId });
  },

  // Composants d'un fournisseur dont le stock est <= seuil (alerte stock faible).
  findLowStockBySupplier(supplierId, threshold = 5) {
    return Component.find({ supplier: supplierId, stock: { $lte: threshold } })
      .select('name stock')
      .sort('stock');
  },

  // Décrémente le stock de façon ATOMIQUE et sûre : la condition `stock >= qty`
  // dans le filtre garantit qu'on ne descend jamais en dessous de zéro, même en
  // cas d'accès concurrents. Renvoie le document mis à jour, ou `null` si le
  // stock était insuffisant (aucune modification effectuée).
  decrementStock(id, qty) {
    return Component.findOneAndUpdate(
      { _id: id, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { returnDocument: 'after' }
    );
  },

  // Réincrémente le stock (annulation : restitution de la réservation). Toujours
  // sûr — aucune condition n'est nécessaire pour ajouter du stock.
  incrementStock(id, qty) {
    return Component.findByIdAndUpdate(
      id,
      { $inc: { stock: qty } },
      { returnDocument: 'after' }
    );
  }
};

module.exports = componentRepository;

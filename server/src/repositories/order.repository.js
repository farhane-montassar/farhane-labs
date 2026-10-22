const mongoose = require('mongoose');
const Order = require('../models/Order');

// Repository Order : centralise TOUT l'accès Mongoose aux commandes.
const orderRepository = {
  create(data) {
    return Order.create(data);
  },

  // Détail d'une commande, avec les références utiles peuplées.
  findById(id) {
    return Order.findById(id)
      .populate('user', 'name email')
      .populate('items.component', 'name category price images')
      .populate('items.supplier', 'companyName');
  },

  // Commandes d'un utilisateur (les siennes), les plus récentes d'abord.
  findByUser(userId) {
    return Order.find({ user: userId })
      .populate('items.component', 'name category price images')
      .sort('-createdAt');
  },

  // Commandes contenant au moins un item d'un fournisseur donné (dashboard
  // fournisseur), les plus récentes d'abord. Les items des AUTRES fournisseurs
  // restent présents ici ; le service les filtre pour ne montrer que les siens.
  findBySupplier(supplierId) {
    return Order.find({ 'items.supplier': supplierId })
      .populate('user', 'name email')
      .populate('items.component', 'name category price images')
      .sort('-createdAt');
  },

  // Agrège les ventes PAYÉES d'un fournisseur : chiffre d'affaires (somme des
  // price*quantity de SES items) et nombre de commandes payées le concernant.
  async salesStatsBySupplier(supplierId) {
    const sid = new mongoose.Types.ObjectId(supplierId);
    const result = await Order.aggregate([
      { $match: { status: 'paid', 'items.supplier': sid } },
      { $unwind: '$items' },
      { $match: { 'items.supplier': sid } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          paidOrders: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          paidOrderCount: { $size: '$paidOrders' }
        }
      }
    ]);

    if (!result.length) {
      return { totalSales: 0, paidOrderCount: 0 };
    }
    const { totalSales, paidOrderCount } = result[0];
    return { totalSales: Math.round(totalSales * 100) / 100, paidOrderCount };
  },

  // Nombre total de commandes (tous statuts) contenant un item du fournisseur.
  countBySupplier(supplierId) {
    return Order.countDocuments({ 'items.supplier': supplierId });
  },

  // Indique si l'utilisateur a au moins une commande PAYÉE contenant ce composant.
  // Sert à n'autoriser un avis que pour un composant réellement acheté.
  async existsPaidOrderWithComponent(userId, componentId) {
    const order = await Order.exists({
      user: userId,
      status: 'paid',
      'items.component': componentId
    });
    return Boolean(order);
  },

  // Toutes les commandes (dashboard admin), les plus récentes d'abord.
  findAll() {
    return Order.find({})
      .populate('user', 'name email')
      .populate('items.component', 'name category price images')
      .populate('items.supplier', 'companyName')
      .sort('-createdAt');
  },

  // Nombre total de commandes (filtre optionnel, ex. { status: 'paid' }).
  count(filter = {}) {
    return Order.countDocuments(filter);
  },

  // Chiffre d'affaires global : somme des totalAmount des commandes payées.
  async totalRevenue() {
    const result = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]);
    const revenue = result.length ? result[0].revenue : 0;
    return Math.round(revenue * 100) / 100;
  },

  // Mise à jour partielle (ex. passage en 'paid' + paymentIntentId).
  updateById(id, data) {
    return Order.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
      .populate('user', 'name email')
      .populate('items.component', 'name category price images')
      .populate('items.supplier', 'companyName');
  }
};

module.exports = orderRepository;

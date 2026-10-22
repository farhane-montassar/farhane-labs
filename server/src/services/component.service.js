const componentRepository = require('../repositories/component.repository');
const supplierRepository = require('../repositories/supplier.repository');
const ApiError = require('../utils/ApiError');

// Champs qu'un client peut envoyer (on ne fait JAMAIS confiance au reste,
// notamment `supplier` qui est déterminé côté serveur).
const WRITABLE_FIELDS = [
  'name', 'description', 'category', 'price', 'stock',
  'images', 'specs', 'boardCapabilities'
];

function pick(source, fields) {
  const out = {};
  for (const f of fields) {
    if (source[f] !== undefined) out[f] = source[f];
  }
  return out;
}

// Construit le filtre Mongoose + les options (tri/pagination) à partir
// des query params. Le repository se contente ensuite de les exécuter.
function buildListQuery(query) {
  const filter = {};

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.supplier) {
    filter.supplier = query.supplier;
  }
  if (query.voltage !== undefined && query.voltage !== '') {
    // Chevauchement de plage : on garde un composant si la tension demandée tombe
    // dans sa plage [voltageMin, voltageMax], OU si sa tension nominale correspond
    // (composants ne déclarant qu'un `voltage` unique).
    const v = Number(query.voltage);
    filter.$or = [
      { 'specs.voltageMin': { $lte: v }, 'specs.voltageMax': { $gte: v } },
      { 'specs.voltage': v }
    ];
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined && query.minPrice !== '') filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice !== undefined && query.maxPrice !== '') filter.price.$lte = Number(query.maxPrice);
  }

  const sort = query.sort || '-createdAt';

  // Pagination : page >= 1, limit borné entre 1 et 100.
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || 12;
  limit = Math.min(Math.max(limit, 1), 100);
  const skip = (page - 1) * limit;

  return { filter, sort, skip, limit, page };
}

// Vérifie qu'un user a le droit de modifier/supprimer un composant donné.
// Admin : toujours. Sinon : il faut être le fournisseur propriétaire.
async function assertOwnership(user, component) {
  if (user.role === 'admin') return;

  const supplier = await supplierRepository.findByUser(user.id);
  if (!supplier) {
    throw new ApiError(403, 'Aucun profil fournisseur associé à ce compte');
  }

  // component.supplier est peuplé (objet) ou un ObjectId selon la requête.
  const ownerId = component.supplier && component.supplier._id
    ? component.supplier._id
    : component.supplier;

  if (String(ownerId) !== String(supplier._id)) {
    throw new ApiError(403, 'Accès refusé : ce composant ne vous appartient pas');
  }
}

const componentService = {
  // Liste publique avec recherche, filtres, tri et pagination.
  async list(query) {
    const { filter, sort, skip, limit, page } = buildListQuery(query);

    const [items, total] = await Promise.all([
      componentRepository.find(filter, { sort, skip, limit }),
      componentRepository.count(filter)
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit) || 0,
      limit
    };
  },

  // Détail public.
  async getById(id) {
    const component = await componentRepository.findById(id);
    if (!component) {
      throw new ApiError(404, 'Composant introuvable');
    }
    return component;
  },

  // Création. Le fournisseur du composant est déterminé côté serveur :
  // - admin  : doit fournir un `supplierId` valide dans le body.
  // - supplier : déduit du token, et son Supplier doit être `approved`.
  async create(user, body) {
    let supplierId;

    if (user.role === 'admin') {
      if (!body.supplierId) {
        throw new ApiError(400, 'supplierId est requis pour une création par un admin');
      }
      const supplier = await supplierRepository.findById(body.supplierId);
      if (!supplier) {
        throw new ApiError(404, 'Fournisseur (supplierId) introuvable');
      }
      supplierId = supplier._id;
    } else {
      // role === 'supplier' (garanti par le middleware authorize)
      const supplier = await supplierRepository.findByUser(user.id);
      if (!supplier) {
        throw new ApiError(403, 'Aucun profil fournisseur associé à ce compte');
      }
      if (supplier.status !== 'approved') {
        throw new ApiError(403, 'Votre compte fournisseur doit être approuvé pour vendre');
      }
      supplierId = supplier._id;
    }

    const data = pick(body, WRITABLE_FIELDS);
    data.supplier = supplierId; // jamais pris depuis le body

    return componentRepository.create(data);
  },

  // Modification. Ownership vérifié ; le supplier reste immuable.
  async update(user, id, body) {
    const component = await componentRepository.findById(id);
    if (!component) {
      throw new ApiError(404, 'Composant introuvable');
    }

    await assertOwnership(user, component);

    const data = pick(body, WRITABLE_FIELDS); // exclut supplier/supplierId
    return componentRepository.updateById(id, data);
  },

  // Suppression. Ownership vérifié.
  async remove(user, id) {
    const component = await componentRepository.findById(id);
    if (!component) {
      throw new ApiError(404, 'Composant introuvable');
    }

    await assertOwnership(user, component);

    await componentRepository.deleteById(id);
    return { id };
  }
};

module.exports = componentService;

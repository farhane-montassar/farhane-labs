const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const adminController = {
  // GET /api/admin/suppliers — liste des fournisseurs (filtre ?status=)
  listSuppliers: asyncHandler(async (req, res) => {
    const data = await adminService.listSuppliers(req.query);
    sendResponse(res, { statusCode: 200, data, message: 'Liste des fournisseurs' });
  }),

  // PATCH /api/admin/suppliers/:id/approve — approuve un fournisseur
  approveSupplier: asyncHandler(async (req, res) => {
    const data = await adminService.setSupplierStatus(req.params.id, 'approved');
    sendResponse(res, { statusCode: 200, data, message: 'Fournisseur approuvé' });
  }),

  // PATCH /api/admin/suppliers/:id/reject — refuse un fournisseur
  rejectSupplier: asyncHandler(async (req, res) => {
    const data = await adminService.setSupplierStatus(req.params.id, 'rejected');
    sendResponse(res, { statusCode: 200, data, message: 'Fournisseur refusé' });
  }),

  // GET /api/admin/users — liste des utilisateurs (filtre ?role=)
  listUsers: asyncHandler(async (req, res) => {
    const data = await adminService.listUsers(req.query);
    sendResponse(res, { statusCode: 200, data, message: 'Liste des utilisateurs' });
  }),

  // GET /api/admin/orders — toutes les commandes
  listOrders: asyncHandler(async (req, res) => {
    const data = await adminService.listOrders();
    sendResponse(res, { statusCode: 200, data, message: 'Toutes les commandes' });
  }),

  // GET /api/admin/stats — statistiques globales
  stats: asyncHandler(async (req, res) => {
    const data = await adminService.stats();
    sendResponse(res, { statusCode: 200, data, message: 'Statistiques globales' });
  })
};

module.exports = adminController;

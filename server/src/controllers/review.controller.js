const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// Le controller ne fait QUE : lire la requête, appeler le service, répondre.
const reviewController = {
  // GET /api/components/:id/reviews — liste publique des avis d'un composant
  listByComponent: asyncHandler(async (req, res) => {
    const data = await reviewService.listByComponent(req.params.id);
    sendResponse(res, { statusCode: 200, data, message: 'Avis du composant' });
  }),

  // POST /api/components/:id/reviews — laisse un avis (client ayant acheté)
  create: asyncHandler(async (req, res) => {
    const data = await reviewService.create(req.user, req.params.id, req.body);
    sendResponse(res, { statusCode: 201, data, message: 'Avis publié' });
  }),

  // PUT /api/reviews/:id — modifie son avis (auteur ou admin)
  update: asyncHandler(async (req, res) => {
    const data = await reviewService.update(req.user, req.params.id, req.body);
    sendResponse(res, { statusCode: 200, data, message: 'Avis mis à jour' });
  }),

  // DELETE /api/reviews/:id — supprime un avis (auteur ou admin)
  remove: asyncHandler(async (req, res) => {
    const data = await reviewService.remove(req.user, req.params.id);
    sendResponse(res, { statusCode: 200, data, message: 'Avis supprimé' });
  })
};

module.exports = reviewController;

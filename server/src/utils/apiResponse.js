// Réponse API normalisée : { success, data, message }
// Utilisé par TOUS les controllers pour garantir un format unique.
function sendResponse(res, { statusCode = 200, data = null, message = '' } = {}) {
  return res.status(statusCode).json({
    success: statusCode < 400,
    data,
    message
  });
}

module.exports = sendResponse;

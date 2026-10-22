const express = require('express');

const authController = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../validators/auth.validator');
const validate = require('../middlewares/validate');
const protect = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = express.Router();

// --- Routes publiques ---
// Flux : validation → controller → service → repository
router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);

// --- Routes protégées (JWT requis) ---
router.get('/me', protect, authController.me);

// --- Route protégée par rôle (démo middleware `authorize`) ---
// Accessible uniquement aux admins.
router.get('/admin-check', protect, authorize('admin'), authController.adminCheck);

module.exports = router;

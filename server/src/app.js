const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

// --- Sécurité & middlewares globaux ---
app.use(helmet());                                   // en-têtes HTTP sécurisés
app.use(cors({ origin: process.env.CLIENT_URL || '*' })); // autorise le frontend
app.use(express.json());                             // parse le body JSON
app.use(express.urlencoded({ extended: true }));     // parse les formulaires

// --- Routes de l'API (toutes préfixées par /api) ---
app.use('/api', routes);

// --- Gestion des erreurs (toujours en dernier) ---
app.use(notFound);       // 404 pour les routes inconnues
app.use(errorHandler);   // gestionnaire d'erreurs centralisé

module.exports = app;

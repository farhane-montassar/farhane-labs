require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// On connecte la base AVANT d'écouter : si la DB est down, on ne démarre pas.
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  });
};

start();

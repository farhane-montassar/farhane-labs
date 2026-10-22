const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  category:    { type: String, enum: ['board', 'sensor', 'module', 'accessory', 'display', 'motor', 'power'], required: true },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, required: true, min: 0, default: 0 },
  images:      [{ type: String }],
  supplier:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },

  // Caractéristiques techniques (capteurs / modules / accessoires / …)
  specs: {
    voltage:    { type: Number },                        // tension NOMINALE (ex. 3.3 ou 5)
    voltageMin: { type: Number },                        // borne basse de la plage de tension
    voltageMax: { type: Number },                        // borne haute (= min si valeur unique)
    interface:  { type: String, enum: ['I2C', 'SPI', 'UART', 'analog', 'digital', 'power', 'PWM', 'driver', 'USB', 'wireless'] },
    pinsUsed:   { type: Number, default: 0 },            // nombre de broches occupées
    notes:      { type: String },                        // caractéristiques descriptives libres

    // --- Logique avancée du configurateur ---
    requiresDriver:        { type: Boolean, default: false }, // ex. moteur pas-à-pas (NEMA 17)
    isDriver:              { type: Boolean, default: false }, // ex. driver A4988
    isPowerSupply:         { type: Boolean, default: false }, // ex. alimentation 12V
    requiresExternalPower: { type: Boolean, default: false }, // doit être alimenté par une alim externe (pas la carte)
    powerOutput: {                                        // pour une alimentation (isPowerSupply)
      voltage:  { type: Number },
      currentA: { type: Number }
    },
    // Convertisseur DC-DC (ex. LM2596) : plage de tension d'ENTRÉE acceptée. Sa présence
    // signale qu'il ne se suffit pas à lui-même → il lui faut une source d'entrée à abaisser.
    inputMin: { type: Number },
    inputMax: { type: Number }
  },

  // Capacités de la carte (uniquement si category === 'board')
  boardCapabilities: {
    voltagesSupported: [{ type: Number }],               // ex. [3.3, 5]
    digitalPins:       { type: Number },
    analogPins:        { type: Number },
    buses:             [{ type: String }]                // ex. ['I2C', 'SPI', 'UART']
  },

  ratingAverage: { type: Number, default: 0 },
  ratingCount:   { type: Number, default: 0 }
}, { timestamps: true });

// Index pour la recherche texte
componentSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Component', componentSchema);

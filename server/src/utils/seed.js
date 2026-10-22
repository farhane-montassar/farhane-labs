// Seed de données de test.
// Lancement : `npm run seed` (depuis le dossier server/).
// Vide puis recrée : comptes de démo, un fournisseur approuvé, et les composants.
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Component = require('../models/Component');
const Notification = require('../models/Notification');

// Composants du catalogue. Le champ `supplier` est ajouté dynamiquement après
// création du fournisseur. Prix en TND. Images servies depuis client/public/images/
// (le placeholder front prend le relais pour toute image absente).
//
// Tension : valeur unique → voltageMin = voltageMax. Plage → min/max distincts.
// `specs.notes` porte la description technique ; les booléens (requiresDriver,
// isDriver, isPowerSupply, requiresExternalPower) pilotent la logique avancée du
// configurateur.

// --- Fournisseur 1 : TechParts SARL (cartes + capteurs/modules de base) ---
const sampleComponents = [
  {
    name: 'Arduino Uno R3', category: 'board', price: 35, stock: 40,
    images: ['/images/arduino-uno.jpg'],
    specs: { voltage: 5, voltageMin: 5, voltageMax: 5, interface: 'UART', notes: 'ATmega328P, 14 E/S numériques' },
    boardCapabilities: { voltagesSupported: [5], digitalPins: 14, analogPins: 6, buses: ['I2C', 'SPI', 'UART'] }
  },
  {
    name: 'ESP32 DevKit V1', category: 'board', price: 35, stock: 50,
    images: ['/images/esp32.jpg'],
    specs: { voltage: 3.3, voltageMin: 3.3, voltageMax: 3.3, interface: 'wireless', notes: 'Dual Core 240 MHz, WiFi et Bluetooth' },
    boardCapabilities: { voltagesSupported: [3.3], digitalPins: 25, analogPins: 6, buses: ['I2C', 'SPI', 'UART'] }
  },
  // Stock volontairement faible (<= 5) pour tester l'alerte stock du dashboard fournisseur.
  { name: 'HC-SR04', category: 'sensor', price: 8, stock: 4, images: ['/images/hc-sr04.jpg'], specs: { voltage: 5, voltageMin: 5, voltageMax: 5, interface: 'digital', pinsUsed: 2, notes: 'Distance 2-400 cm, précision ±3 mm' } },
  { name: 'DHT22', category: 'sensor', price: 15, stock: 100, images: ['/images/dht22.jpg'], specs: { voltage: 5, voltageMin: 3.3, voltageMax: 5, interface: 'digital', pinsUsed: 1, notes: 'Température -40 à 80°C, humidité 0-100%' } },
  { name: 'OLED 0.96 I2C', category: 'display', price: 18, stock: 80, images: ['/images/oled-i2c.png'], specs: { voltage: 5, voltageMin: 3.3, voltageMax: 5, interface: 'I2C', pinsUsed: 2, notes: 'Afficheur OLED 128×64 pixels' } },
  // Relais 5V : illustre le cas « compatible_adaptation ». requiresExternalPower → la bobine
  // exige une alim 5V dédiée (pas la carte). Sur ESP32 (3.3V) sans source : solution = alim 5V
  // directe ; avec une source 12V présente : solution = Convertisseur DC-DC LM2596.
  {
    name: 'Module relais 1 canal', category: 'module', price: 10, stock: 120,
    images: ['/images/relay-1ch.jpg'],
    description: "Module relais 1 canal pour commander des charges AC/DC depuis Arduino, ESP32, ESP8266. Domotique, automatisation, systèmes embarqués.",
    specs: { voltage: 5, voltageMin: 5, voltageMax: 5, interface: 'digital', pinsUsed: 1, requiresExternalPower: true, notes: 'Charge maximale 250VAC / 10A' }
  },
  // Volontairement SANS tension : teste le cas « warning » du configurateur.
  { name: 'Push Button Metal', category: 'accessory', price: 4, stock: 200, images: ['/images/bouton-poussoir.jpg'], specs: { interface: 'digital', pinsUsed: 1, notes: 'Bouton poussoir momentané' } },
  { name: 'Buzzer', category: 'module', price: 3, stock: 150, images: ['/images/buzzer.jpg'], specs: { voltage: 5, voltageMin: 3.3, voltageMax: 5, interface: 'digital', pinsUsed: 1, notes: 'Alarme sonore et signalisation' } },
  { name: 'Capteur IR', category: 'sensor', price: 6, stock: 90, images: ['/images/capteur-infrarouge.jpg'], specs: { voltage: 5, voltageMin: 3.3, voltageMax: 5, interface: 'digital', pinsUsed: 1, notes: "Détection d'obstacle de 2 à 30 cm" } }
];

// --- Fournisseur 2 : IoT Store (motorisation, alimentation, périphériques) ---
// Sert aussi à vérifier le cloisonnement : chaque fournisseur ne voit QUE ses composants.
const sampleComponents2 = [
  { name: 'SG90', category: 'motor', price: 12, stock: 60, images: ['/images/servo-sg90.jpg'], specs: { voltage: 5, voltageMin: 4.8, voltageMax: 6, interface: 'PWM', pinsUsed: 1, notes: 'Rotation 0-180°, couple 1.8 kg.cm' } },
  { name: 'Clavier matriciel 4×4', category: 'accessory', price: 8, stock: 70, images: ['/images/clavier.png'], specs: { voltage: 5, voltageMin: 3.3, voltageMax: 5, interface: 'digital', pinsUsed: 8, notes: '16 touches pour saisie utilisateur' } },
  { name: 'LCD I2C 20×4', category: 'display', price: 22, stock: 55, images: ['/images/lcd-i2c.jpg'], specs: { voltage: 5, voltageMin: 5, voltageMax: 5, interface: 'I2C', pinsUsed: 2, notes: 'Affichage texte 20 colonnes × 4 lignes' } },
  { name: 'NEMA 17', category: 'motor', price: 45, stock: 30, images: ['/images/nema17.jpg'], specs: { voltage: 12, voltageMin: 12, voltageMax: 12, interface: 'driver', pinsUsed: 4, notes: 'Moteur pas à pas 1.8°/pas, 200 pas/tour', requiresDriver: true, requiresExternalPower: true } },
  { name: 'Driver A4988', category: 'module', price: 10, stock: 100, images: ['/images/driver-a4988.jpg'], specs: { voltageMin: 8, voltageMax: 35, interface: 'driver', pinsUsed: 2, notes: 'Driver moteur pas à pas, courant max 2A', isDriver: true } },
  { name: 'Limit Switch', category: 'sensor', price: 5, stock: 110, images: ['/images/limit-switch.jpg'], specs: { voltage: 5, voltageMin: 3.3, voltageMax: 5, interface: 'digital', pinsUsed: 1, notes: 'Capteur de fin de course pour référencement HOME' } },
  { name: 'Alimentation 12V 5A', category: 'power', price: 35, stock: 45, images: ['/images/alimentation.jpg'], specs: { voltage: 12, interface: 'power', pinsUsed: 0, notes: 'Alimentation stabilisée 60W', isPowerSupply: true, powerOutput: { voltage: 12, currentA: 5 } } },
  // Alimentation 5V directe (VRAIE source 5V, pas un convertisseur : pas d'inputMin/Max).
  // C'est le correctif recommandé par le configurateur pour un besoin 5V QUAND aucune
  // source supérieure n'est présente (ex. SG90 seul sur ESP32).
  { name: 'Alimentation 5V 3A', category: 'power', price: 18, stock: 60, images: ['/images/alimentation.jpg'], description: 'Alimentation stabilisée 5V 3A pour servomoteurs, relais et modules 5V — source directe sans conversion.', specs: { voltage: 5, interface: 'power', pinsUsed: 0, notes: 'Alimentation stabilisée 15W', isPowerSupply: true, powerOutput: { voltage: 5, currentA: 3 } } },
  // Convertisseur Buck : abaisse une source supérieure (ex. 12V) vers 5V. C'est la solution
  // recommandée par le configurateur pour un besoin 5V QUAND une source 12V est déjà présente.
  // inputMin/inputMax = plage d'entrée → signale qu'il lui faut une source à convertir.
  {
    name: 'Convertisseur DC-DC LM2596', category: 'power', price: 12, stock: 75,
    images: ['/images/lm2596.jpg'],
    description: "Convertisseur Buck DC-DC abaissant une tension d'entrée (ex. 12V) vers une sortie 5V réglable et stable. Idéal pour alimenter servomoteurs, relais et composants 5V depuis une source supérieure.",
    specs: { voltage: 5, interface: 'power', pinsUsed: 0, notes: 'Sortie réglable 1.25-30V, entrée 4-35V, 3A', isPowerSupply: true, inputMin: 4, inputMax: 35, powerOutput: { voltage: 5, currentA: 3 } }
  },
  { name: 'Scanner USB 1D', category: 'accessory', price: 80, stock: 25, images: ['/images/scanner.jpg'], specs: { voltage: 5, voltageMin: 5, voltageMax: 5, interface: 'USB', pinsUsed: 0, notes: 'Lecture de codes-barres 1D, portée 5 à 30 cm' } }
];

// Comptes de démo. Le mot de passe est haché automatiquement par le pre-save User.
const demoUsers = [
  { name: 'Admin Farhane', email: 'admin@farhane.com', password: 'admin123', role: 'admin' },
  { name: 'Client Démo', email: 'client@farhane.com', password: 'client123', role: 'client' }
];

const seed = async () => {
  await connectDB();

  try {
    // 1. Nettoyage
    await Promise.all([
      User.deleteMany({}),
      Supplier.deleteMany({}),
      Component.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🧹 Collections vidées');

    // 2. Comptes de démo (admin + client).
    //    create() en boucle pour déclencher le hook de hachage sur chaque user.
    //    On garde la référence du client pour lui rattacher des notifications de démo.
    let clientUser = null;
    for (const u of demoUsers) {
      const created = await User.create(u);
      if (created.role === 'client') clientUser = created;
    }
    console.log('👤 Comptes admin + client créés');

    // 3. Un user fournisseur + son profil Supplier approuvé.
    const supplierUser = await User.create({
      name: 'TechParts SARL', email: 'supplier@farhane.com', password: 'supplier123', role: 'supplier'
    });
    const supplier = await Supplier.create({
      user: supplierUser._id,
      companyName: 'TechParts SARL',
      description: 'Fournisseur de démo (composants Arduino/ESP32).',
      status: 'approved'
    });
    console.log('🏭 Fournisseur de démo créé (approuvé)');

    // 4. Composants rattachés au fournisseur de démo
    const componentsWithSupplier = sampleComponents.map((c) => ({ ...c, supplier: supplier._id }));
    await Component.insertMany(componentsWithSupplier);
    console.log(`🔧 ${componentsWithSupplier.length} composants insérés (fournisseur 1)`);

    // 5. Un SECOND fournisseur approuvé + ses propres composants.
    //    Permet de tester le cloisonnement entre fournisseurs.
    const supplier2User = await User.create({
      name: 'IoT Store', email: 'supplier2@farhane.com', password: 'supplier123', role: 'supplier'
    });
    const supplier2 = await Supplier.create({
      user: supplier2User._id,
      companyName: 'IoT Store',
      description: 'Second fournisseur de démo (capteurs et modules).',
      status: 'approved'
    });
    const components2WithSupplier = sampleComponents2.map((c) => ({ ...c, supplier: supplier2._id }));
    await Component.insertMany(components2WithSupplier);
    console.log(`🏭 Second fournisseur approuvé + ${components2WithSupplier.length} composants insérés (fournisseur 2)`);

    // 6. Un fournisseur en attente (status pending) SANS composant.
    //    Permet de tester l'approbation/refus côté admin et le blocage du
    //    dashboard fournisseur tant qu'il n'est pas approuvé.
    const pendingUser = await User.create({
      name: 'Pending Supplier', email: 'pending@farhane.com', password: 'supplier123', role: 'supplier'
    });
    await Supplier.create({
      user: pendingUser._id,
      companyName: 'Pending Supplier',
      description: 'Fournisseur en attente de validation.',
      status: 'pending'
    });
    console.log('⏳ Fournisseur en attente (pending) créé');

    // 7. Notifications de démo pour le client (test de la cloche / du panneau).
    if (clientUser) {
      await Notification.insertMany([
        {
          user: clientUser._id, type: 'info',
          title: 'Bienvenue sur Farhane Labs 👋',
          message: 'Votre compte est prêt. Explorez le catalogue et composez votre premier kit.',
          link: '/catalogue', read: false
        },
        {
          user: clientUser._id, type: 'order',
          title: 'Votre commande est confirmée',
          message: 'Merci ! Votre commande de démonstration a bien été enregistrée.',
          link: '/mes-commandes', read: false
        }
      ]);
      console.log('🔔 2 notifications de démo créées pour le client');
    }

    console.log('\n✅ Seed terminé. Comptes de test :');
    console.log('   • admin@farhane.com     / admin123    (role: admin)');
    console.log('   • supplier@farhane.com  / supplier123 (role: supplier, approuvé)');
    console.log('   • supplier2@farhane.com / supplier123 (role: supplier, approuvé)');
    console.log('   • pending@farhane.com   / supplier123 (role: supplier, EN ATTENTE)');
    console.log('   • client@farhane.com    / client123   (role: client)');
  } catch (err) {
    console.error('❌ Erreur de seed :', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();

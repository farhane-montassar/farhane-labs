# Farhane Labs — Document de Planification (Partie 2)

> **Modèles de données & moteur de compatibilité — prêt à coder**
> Suite de la Partie 1. **Stack :** MERN + Tailwind/DaisyUI · JWT · Stripe
> **Auteur :** Montassar Farhane

---

## 1. Initialisation du projet

### 1.1 Structure de démarrage

```
farhane-labs/
├── server/
│   ├── src/
│   │   ├── config/        db.js
│   │   ├── models/        User, Supplier, Component, Kit, Order, Review
│   │   ├── repositories/
│   │   ├── services/      compatibility.service.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/   auth.js, role.js, error.js
│   │   ├── validators/
│   │   ├── utils/
│   │   └── app.js
│   ├── .env
│   ├── .env.example
│   └── server.js
└── client/   (créé ensuite avec Vite)
```

### 1.2 Commandes d'installation (backend)

```bash
mkdir farhane-labs && cd farhane-labs
mkdir server && cd server
npm init -y
npm install express mongoose dotenv cors helmet bcryptjs jsonwebtoken express-validator multer cloudinary stripe
npm install -D nodemon
```

### 1.3 Variables d'environnement (`.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/farhane_labs
JWT_SECRET=remplace_par_une_longue_chaine_secrete
JWT_EXPIRES=7d
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_URL=cloudinary://...
CLIENT_URL=http://localhost:5173
```

> Ajoute `.env` au `.gitignore` dès le départ. Commit le `.env.example` (sans les vraies valeurs).

### 1.4 Connexion à la base (`src/config/db.js`)

```js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## 2. Vue d'ensemble des relations

```
User (1) ───< (1) Supplier
Supplier (1) ───< (N) Component
Component (board) ──┐
Component (N) ──────┼──< Kit (board + components[])
User (1) ───< (N) Kit
User (1) ───< (N) Order ───< (N) items → Component + Supplier
User (1) ───< (N) Review >─── (1) Component
```

- Un **User** de rôle `supplier` possède **un** profil **Supplier**.
- Un **Supplier** possède **plusieurs** **Components**.
- Un **Kit** = une carte (`board`) + une liste de composants ; il appartient à un User (config sauvegardée) ou est pré-fait (`isPrebuilt`).
- Une **Order** contient des `items` qui mémorisent le composant, son fournisseur, le prix et la quantité au moment de l'achat.
- Une **Review** lie un User à un Component (un seul avis par utilisateur et par produit).

---

## 3. Les modèles Mongoose

### 3.1 User — `models/User.js`

```js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['client', 'supplier', 'admin'], default: 'client' },
  address: {
    street: String, city: String, zip: String, country: String
  }
}, { timestamps: true });

// Hachage automatique du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode de comparaison à la connexion
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

> `select: false` empêche le mot de passe d'être renvoyé par défaut dans les requêtes.

---

### 3.2 Supplier — `models/Supplier.js`

```js
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true, trim: true },
  description: { type: String },
  logo:        { type: String },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
```

> Un fournisseur ne peut vendre que si `status === 'approved'` (vérifié dans le middleware/service).

---

### 3.3 Component — `models/Component.js`

C'est le modèle central, qui porte les caractéristiques techniques utilisées par le configurateur.

```js
const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  category:    { type: String, enum: ['board', 'sensor', 'module', 'accessory'], required: true },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, required: true, min: 0, default: 0 },
  images:      [{ type: String }],
  supplier:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },

  // Caractéristiques techniques (capteurs / modules / accessoires)
  specs: {
    voltage:   { type: Number },                         // ex. 3.3 ou 5
    interface: { type: String, enum: ['I2C', 'SPI', 'UART', 'analog', 'digital', 'power'] },
    pinsUsed:  { type: Number, default: 0 }              // nombre de broches occupées
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
```

---

### 3.4 Kit — `models/Kit.js`

```js
const mongoose = require('mongoose');

const kitSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },        // null si pré-fait
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  components: [{
    component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
    quantity:  { type: Number, default: 1, min: 1 }
  }],
  totalPrice:          { type: Number, default: 0 },
  isPrebuilt:          { type: Boolean, default: false },
  compatibilityStatus: { type: String, enum: ['compatible', 'warning', 'incompatible'], default: 'compatible' }
}, { timestamps: true });

module.exports = mongoose.model('Kit', kitSchema);
```

---

### 3.5 Order — `models/Order.js`

```js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
    supplier:  { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    name:      { type: String, required: true },     // figé au moment de l'achat
    price:     { type: Number, required: true },     // figé au moment de l'achat
    quantity:  { type: Number, required: true, min: 1 }
  }],
  totalAmount:     { type: Number, required: true },
  status:          { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentIntentId: { type: String },
  shippingAddress: {
    street: String, city: String, zip: String, country: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
```

> On **fige** `name` et `price` dans chaque item : si le fournisseur change son prix plus tard, l'historique de commande reste exact.

---

### 3.6 Review — `models/Review.js`

```js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, trim: true }
}, { timestamps: true });

// Un seul avis par utilisateur et par composant
reviewSchema.index({ user: 1, component: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
```

---

## 4. Le moteur de compatibilité (service)

La pièce maîtresse. Il reçoit une **carte** et une **liste de composants**, et renvoie un statut + des messages explicites.

### 4.1 Règles

1. **Tension** — `component.specs.voltage` doit figurer dans `board.boardCapabilities.voltagesSupported`.
2. **Broches** — la somme des `pinsUsed` ne doit pas dépasser le total de broches disponibles.
3. **Bus** — si `component.specs.interface` est un bus (I2C/SPI/UART), il doit figurer dans `board.boardCapabilities.buses`.
4. **Statut global** — `incompatible` si au moins une erreur bloquante, `warning` si tension absente/non renseignée, sinon `compatible`.

### 4.2 Code — `services/compatibility.service.js`

```js
function validateConfiguration(board, components) {
  const messages = [];
  let status = 'compatible';

  const caps = board.boardCapabilities || {};
  const supportedVoltages = caps.voltagesSupported || [];
  const availablePins = (caps.digitalPins || 0) + (caps.analogPins || 0);
  const availableBuses = caps.buses || [];
  const busTypes = ['I2C', 'SPI', 'UART'];

  let usedPins = 0;

  for (const c of components) {
    const specs = c.specs || {};

    // 1. Tension
    if (specs.voltage != null && supportedVoltages.length) {
      if (!supportedVoltages.includes(specs.voltage)) {
        status = 'incompatible';
        messages.push(`❌ ${c.name} (${specs.voltage}V) incompatible avec la carte (${supportedVoltages.join('/')}V).`);
      }
    } else {
      if (status !== 'incompatible') status = 'warning';
      messages.push(`⚠️ Tension non renseignée pour ${c.name}.`);
    }

    // 2. Bus
    if (busTypes.includes(specs.interface) && !availableBuses.includes(specs.interface)) {
      status = 'incompatible';
      messages.push(`❌ ${c.name} requiert le bus ${specs.interface}, absent de la carte.`);
    }

    // 3. Broches
    usedPins += specs.pinsUsed || 0;
  }

  // 4. Broches totales
  if (usedPins > availablePins) {
    status = 'incompatible';
    messages.push(`❌ Broches insuffisantes : ${usedPins} requises, ${availablePins} disponibles.`);
  }

  if (status === 'compatible') messages.push('✅ Configuration compatible.');

  return { status, usedPins, availablePins, messages };
}

module.exports = { validateConfiguration };
```

### 4.3 Exemple concret

**Carte** — ESP32 :
```js
{ name: 'ESP32 DevKit', boardCapabilities: { voltagesSupported: [3.3], digitalPins: 25, analogPins: 6, buses: ['I2C','SPI','UART'] } }
```

**Composants ajoutés :**
```js
[
  { name: 'Capteur DHT22',  specs: { voltage: 3.3, interface: 'digital', pinsUsed: 1 } },
  { name: 'Écran OLED I2C', specs: { voltage: 3.3, interface: 'I2C',     pinsUsed: 2 } },
  { name: 'Relais 5V',      specs: { voltage: 5,   interface: 'digital', pinsUsed: 1 } }
]
```

**Résultat :** `status: 'incompatible'`
→ `❌ Relais 5V (5V) incompatible avec la carte (3.3V).`
(les deux autres composants passent ; le relais 5V déclenche l'incompatibilité.)

C'est exactement ce type de retour que le configurateur affichera en temps réel côté React.

---

## 5. Données de test (seed) — exemple

À placer dans `utils/seed.js` pour remplir la base au démarrage et tester rapidement.

```js
const sampleComponents = [
  {
    name: 'ESP32 DevKit v1', category: 'board', price: 25, stock: 50,
    boardCapabilities: { voltagesSupported: [3.3], digitalPins: 25, analogPins: 6, buses: ['I2C','SPI','UART'] }
  },
  {
    name: 'Arduino Uno R3', category: 'board', price: 20, stock: 40,
    boardCapabilities: { voltagesSupported: [5], digitalPins: 14, analogPins: 6, buses: ['I2C','SPI','UART'] }
  },
  { name: 'Capteur DHT22',  category: 'sensor', price: 6,  stock: 100, specs: { voltage: 3.3, interface: 'digital', pinsUsed: 1 } },
  { name: 'Écran OLED 0.96" I2C', category: 'module', price: 8, stock: 80, specs: { voltage: 3.3, interface: 'I2C', pinsUsed: 2 } },
  { name: 'Module Relais 5V', category: 'module', price: 4, stock: 120, specs: { voltage: 5, interface: 'digital', pinsUsed: 1 } }
];
```

---

## 6. Par où commencer (checklist Phase 0 → 1)

1. ☐ Créer le dossier `server/`, installer les dépendances (§1.2).
2. ☐ Créer `.env` + `.gitignore` + `db.js` (§1.3, §1.4).
3. ☐ Créer les 6 modèles (§3) dans `models/`.
4. ☐ Monter `app.js` + `server.js` (Express + connexion DB).
5. ☐ Implémenter l'**auth** (register/login + hash + JWT) et le middleware de rôles.
6. ☐ Tester avec Postman : créer un user, se connecter, récupérer le token.
7. ☐ Lancer le **seed** pour avoir des composants de test.

Une fois ces étapes faites, on passe au **CRUD du catalogue** puis au **configurateur**.

---

## Prochaine étape — Partie 3

Mise en place du **backend de l'authentification** : `app.js`, middlewares `auth`/`role`, contrôleur d'inscription/connexion avec génération du JWT, et premières routes testables dans Postman.

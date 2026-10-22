# Farhane Labs — Backend (API)

Marketplace de composants et kits électroniques. Backend Node.js / Express / MongoDB.

> **État actuel : backend COMPLET (Phase 0 → 8)** — structure, modèles,
> authentification complète (register / login / JWT + middlewares de rôles),
> **CRUD du catalogue** (composants) avec recherche, filtres, tri et pagination,
> le **CONFIGURATEUR** (moteur de compatibilité + validation + sauvegarde en kit),
> le **TUNNEL D'ACHAT** (commandes + paiement **Stripe** en mode test), les **AVIS**
> (note + commentaire, conditionnés à un achat réel), et les **DASHBOARDS**
> **fournisseur** et **admin**.

---

## 🧱 Architecture

Découpage en couches, identique pour chaque ressource :

```
Route → Middleware (auth/validation) → Controller → Service → Repository → Modèle (Mongoose)
```

- **Controller** : lit la requête, appelle le service, renvoie la réponse (aucune logique métier).
- **Service** : la logique métier.
- **Repository** : seul à accéder à Mongoose (aucune requête Mongoose ailleurs).

```
server/
├── server.js                 # point d'entrée : connecte la DB puis écoute
├── .env / .env.example       # variables d'environnement
└── src/
    ├── config/db.js          # connexion MongoDB
    ├── models/               # 6 modèles Mongoose
    ├── repositories/         # accès aux données
    ├── services/             # logique métier
    ├── controllers/          # entrée/sortie HTTP
    ├── routes/               # définition des endpoints
    ├── middlewares/          # auth (JWT), role, validate, error
    ├── validators/           # règles express-validator
    └── utils/                # asyncHandler, ApiError, apiResponse, jwt, seed
```

---

## 🚀 Installation & lancement

**Prérequis :** Node.js, et un MongoDB accessible (local sur `127.0.0.1:27017` ou MongoDB Atlas).

```bash
cd server
npm install                 # dépendances (déjà installées ici)
cp .env.example .env         # puis renseigne les valeurs (voir ci-dessous)
npm run seed                 # (optionnel) remplit la base avec des données de test
npm run dev                  # démarre avec nodemon (rechargement auto)
# ou : npm start             # démarrage simple sans nodemon
```

Au démarrage tu dois voir :
```
✅ MongoDB connecté
🚀 Serveur lancé sur http://localhost:5000
```

### Variables d'environnement (`.env`)

| Variable            | Description                                    | Exemple |
|---------------------|------------------------------------------------|---------|
| `PORT`              | Port du serveur                                | `5000` |
| `MONGO_URI`         | URI de connexion MongoDB                       | `mongodb://127.0.0.1:27017/farhane_labs` |
| `JWT_SECRET`        | Clé secrète de signature des tokens            | une longue chaîne aléatoire |
| `JWT_EXPIRES`       | Durée de validité du token                     | `7d` |
| `CLIENT_URL`        | Origine autorisée par CORS (frontend)          | `http://localhost:5173` |
| `STRIPE_SECRET_KEY` | **Clé secrète Stripe de test** (paiement). Absente → routes paiement en 503 | `sk_test_...` |
| `CLOUDINARY_URL`    | (Phase upload — non utilisé pour l'instant)    | `cloudinary://...` |

---

## 🌱 Comptes de démonstration (après `npm run seed`)

| Email                   | Mot de passe  | Rôle      | Détail |
|-------------------------|---------------|-----------|--------|
| `admin@farhane.com`     | `admin123`    | admin     | — |
| `supplier@farhane.com`  | `supplier123` | supplier  | **approuvé** — 6 composants (TechParts SARL) |
| `supplier2@farhane.com` | `supplier123` | supplier  | **approuvé** — 2 composants (IoT Store) |
| `pending@farhane.com`   | `supplier123` | supplier  | **en attente** — sans composant |
| `client@farhane.com`    | `client123`   | client    | — |

Le seed crée :
- **2 fournisseurs approuvés** avec leurs propres composants (pour tester le
  **cloisonnement** : chacun ne voit que les siens), et **1 fournisseur `pending`**
  (pour tester l'approbation/refus admin et le blocage du dashboard tant qu'il
  n'est pas approuvé) ;
- **8 composants** au total — dont un « Bouton poussoir » volontairement **sans
  voltage** (cas *warning* du configurateur) et un « Capteur ultrason HC-SR04 »
  en **stock faible** (4 ≤ 5, pour l'alerte stock du dashboard fournisseur).

> ⚠️ Le seed vide/recrée `users`, `suppliers`, `components` mais **pas** `orders`
> ni `reviews`. Pour repartir d'un état 100 % propre, vide aussi ces deux
> collections (ex. via MongoDB Compass).

---

## 📡 Endpoints testables (Postman)

Base URL : `http://localhost:5000`
Toutes les réponses suivent le format : `{ "success": boolean, "data": any, "message": string }`

### 1. Health check
- **GET** `/api/health` — _public_
- Réponse : `{ "success": true, "data": { "status": "up" }, "message": "API opérationnelle" }`

### 2. Inscription
- **POST** `/api/auth/register` — _public_
- Body (JSON) :
  ```json
  { "name": "Jean Dupont", "email": "jean@test.com", "password": "secret6" }
  ```
- Réponse `201` : renvoie `data.user` et `data.token`.
- Note : le rôle est toujours forcé à `client` (sécurité).

### 3. Connexion
- **POST** `/api/auth/login` — _public_
- Body (JSON) :
  ```json
  { "email": "admin@farhane.com", "password": "admin123" }
  ```
- Réponse `200` : `data.token` ← **copie ce token** pour les routes protégées.

### 4. Mon profil (route protégée)
- **GET** `/api/auth/me` — _authentifié (tout rôle)_
- Header : `Authorization: Bearer <token>`
- Réponse `200` : `data` = `{ id, name, email, role }`.

### 5. Vérification admin (route protégée PAR RÔLE)
- **GET** `/api/auth/admin-check` — _admin uniquement_
- Header : `Authorization: Bearer <token>`
- Avec un token **admin** → `200` « Accès admin confirmé ✅ »
- Avec un token **client/supplier** → `403` « Accès refusé : privilèges insuffisants »

> 👉 Pour vérifier le middleware de rôles : connecte-toi avec `client@farhane.com`,
> appelle `/api/auth/admin-check` → tu dois recevoir **403**. Puis recommence avec
> `admin@farhane.com` → **200**.

---

## 📦 Endpoints — Catalogue (composants)

Base URL : `http://localhost:5000`

### 6. Liste des composants
- **GET** `/api/components` — _public_
- Query params (tous optionnels, combinables) :

  | Param | Rôle | Exemple |
  |---|---|---|
  | `search` | recherche texte sur name/description | `?search=ESP32` |
  | `category` | filtre catégorie (`board`/`sensor`/`module`/`accessory`) | `?category=board` |
  | `supplier` | filtre par id de fournisseur | `?supplier=<id>` |
  | `voltage` | filtre `specs.voltage` | `?voltage=3.3` |
  | `minPrice` / `maxPrice` | fourchette de prix | `?minPrice=5&maxPrice=10` |
  | `sort` | tri (`price`, `-price`, `-createdAt`…) | `?sort=-price` |
  | `page` / `limit` | pagination (défaut `1` / `12`, limit max `100`) | `?page=2&limit=5` |

- Exemple : `GET /api/components?category=board&sort=price&page=1&limit=10`
- Réponse `200` : `data = { items: [...], total, page, pages, limit }`.

### 7. Détail d'un composant
- **GET** `/api/components/:id` — _public_
- Réponse `200` : le composant (avec `supplier` peuplé : `companyName`, `status`).
- `400` si l'id est mal formé, `404` s'il n'existe pas.

### 8. Créer un composant
- **POST** `/api/components` — _fournisseur **approuvé** ou admin_
- Header : `Authorization: Bearer <token>`
- Body (fournisseur) — le `supplier` est déduit du token, **pas** du body :
  ```json
  {
    "name": "Capteur PIR HC-SR501",
    "description": "Détecteur de mouvement infrarouge",
    "category": "sensor",
    "price": 3.5,
    "stock": 60,
    "specs": { "voltage": 5, "interface": "digital", "pinsUsed": 1 }
  }
  ```
- Body (admin) — doit **en plus** fournir `supplierId` (à qui rattacher le produit) :
  ```json
  { "name": "...", "category": "module", "price": 8, "supplierId": "<id_supplier>" }
  ```
- Réponse `201` : le composant créé.
- `403` si fournisseur non approuvé ou si le rôle n'est ni supplier ni admin ;
  `400` si `supplierId` manquant pour un admin, ou si validation échouée.

### 9. Modifier un composant
- **PUT** `/api/components/:id` — _propriétaire du composant ou admin_
- Header : `Authorization: Bearer <token>`
- Body : champs à modifier (mise à jour partielle). Le `supplier` n'est pas modifiable.
  ```json
  { "price": 4.0, "stock": 75 }
  ```
- Réponse `200` : le composant mis à jour.
- `403` si on tente de modifier le composant d'un autre fournisseur.

### 10. Supprimer un composant
- **DELETE** `/api/components/:id` — _propriétaire du composant ou admin_
- Header : `Authorization: Bearer <token>`
- Réponse `200` : `data = { id }`.
- `403` si le composant ne vous appartient pas.

> 💡 **Règle clé d'autorisation :** un fournisseur ne peut créer/modifier/supprimer
> que **ses propres** composants, et seulement si son compte est `approved`.
> L'admin n'a aucune restriction d'ownership.

---

## 🧩 Endpoints — Configurateur (moteur de compatibilité)

Base URL : `http://localhost:5000`

Le configurateur reçoit des **identifiants** de composants (jamais les specs brutes) :
le serveur recharge toujours les vrais composants depuis la base avant de valider.

### 11. Valider une configuration
- **POST** `/api/configurator/validate` — _authentifié (tout rôle)_
- Header : `Authorization: Bearer <token>`
- Body (JSON) — `boardId` = id d'un composant de category `board` ;
  `items` = composants à monter, chacun avec une `quantity` optionnelle (défaut `1`) :
  ```json
  {
    "boardId": "<id_ESP32>",
    "items": [
      { "componentId": "<id_DHT22>", "quantity": 1 },
      { "componentId": "<id_OLED>",  "quantity": 1 }
    ]
  }
  ```
- Réponse `200` :
  ```json
  {
    "success": true,
    "data": {
      "status": "compatible",
      "messages": ["✅ Configuration compatible."],
      "usedPins": 3,
      "availablePins": 31,
      "totalPrice": 39
    },
    "message": "Validation de la configuration"
  }
  ```
- `status` ∈ `compatible` | `warning` | `incompatible`. `totalPrice` inclut le prix de la carte.
- `404` si le board ou un composant est introuvable ; `400` si `boardId` ne pointe pas
  sur une carte (`category: 'board'`) ou si le body est mal formé.

**Règles appliquées par le moteur :**
| Règle | Détail | Effet |
|---|---|---|
| Tension | `specs.voltage` doit figurer dans `board.boardCapabilities.voltagesSupported` | `incompatible` si non supportée |
| Tension absente | `specs.voltage` non renseigné | `warning` (non bloquant) |
| Bus | si `specs.interface` ∈ {I2C, SPI, UART}, il doit être dans `board…buses` | `incompatible` si absent |
| Broches | Σ (`pinsUsed` × quantité) ≤ `digitalPins + analogPins` | `incompatible` si dépassement |

---

## 💾 Endpoints — Kits (configs sauvegardées)

### 12. Sauvegarder une configuration en kit
- **POST** `/api/kits` — _authentifié, rôle **client**_
- Header : `Authorization: Bearer <token>`
- Body : comme la validation, plus un `name`. Le serveur **revalide** la config,
  puis enregistre `board`, `components`, `compatibilityStatus`, `totalPrice`,
  avec `owner` = utilisateur du token.
  ```json
  {
    "name": "Station météo ESP32",
    "boardId": "<id_ESP32>",
    "items": [
      { "componentId": "<id_DHT22>", "quantity": 1 },
      { "componentId": "<id_OLED>",  "quantity": 1 }
    ]
  }
  ```
- Réponse `201` : le kit créé (board et composants peuplés).

### 13. Mes kits
- **GET** `/api/kits` — _authentifié (tout rôle)_ — renvoie les kits dont je suis le `owner`.

---

## ⚡ Scénario de test Thunder Client (configurateur)

> **Pré-requis :** lance `npm run seed`, puis connecte-toi
> (`POST /api/auth/login` avec `client@farhane.com` / `client123`) et copie `data.token`.

**Récupérer les identifiants** — fais d'abord :
- **GET** `http://localhost:5000/api/components?limit=100`

Repère les `_id` dans `data.items` (les noms viennent du seed) :

| Composant (seed) | À utiliser comme |
|---|---|
| `ESP32 DevKit v1` (3.3V, buses I2C/SPI/UART) | `boardId` |
| `Capteur DHT22` (3.3V, digital) | item compatible |
| `Écran OLED 0.96" I2C` (3.3V, I2C) | item compatible |
| `Module Relais 5V` (5V) | item **incompatible** (casse la tension) |
| `Bouton poussoir` (sans voltage) | item **warning** |

Astuce : `GET /api/components?category=board` pour isoler les cartes,
et `?search=DHT22` / `?search=Relais` / `?search=Bouton` pour trouver chaque composant.

Toutes les requêtes ci-dessous : **POST** `http://localhost:5000/api/configurator/validate`
avec header `Authorization: Bearer <token>`.

**① Cas COMPATIBLE — ESP32 + DHT22 + OLED I2C (tous 3.3V)**
```json
{
  "boardId": "<id_ESP32>",
  "items": [
    { "componentId": "<id_DHT22>", "quantity": 1 },
    { "componentId": "<id_OLED>",  "quantity": 1 }
  ]
}
```
→ `200`, `status: "compatible"`, message `✅ Configuration compatible.`,
`usedPins: 3`, `availablePins: 31`, `totalPrice: 39` (25 + 6 + 8).

**② Cas INCOMPATIBLE — ESP32 (3.3V) + Relais 5V**
```json
{
  "boardId": "<id_ESP32>",
  "items": [
    { "componentId": "<id_DHT22>",  "quantity": 1 },
    { "componentId": "<id_Relais>", "quantity": 1 }
  ]
}
```
→ `200`, `status: "incompatible"`,
message `❌ Module Relais 5V (5V) incompatible avec la carte (3.3/...V).` — le 5V casse la compatibilité.

**③ Cas WARNING — composant sans voltage (Bouton poussoir)**
```json
{
  "boardId": "<id_ESP32>",
  "items": [
    { "componentId": "<id_DHT22>",  "quantity": 1 },
    { "componentId": "<id_Bouton>", "quantity": 1 }
  ]
}
```
→ `200`, `status: "warning"`,
message `⚠️ Tension non renseignée pour Bouton poussoir : compatibilité non garantie.`

**④ Cas d'erreur — `boardId` qui n'est pas une carte**
Mets l'`_id` du DHT22 dans `boardId` → `400` « … n'est pas une carte (category 'board') ».

**⑤ Sauvegarde en kit (optionnel)** — reprends le body du cas ① en ajoutant `"name": "Station météo ESP32"`,
**POST** `http://localhost:5000/api/kits` (token client) → `201`. Puis **GET** `/api/kits` → ton kit avec `compatibilityStatus: "compatible"`.

---

## 🛒 Endpoints — Commandes

Base URL : `http://localhost:5000`

Le client envoie des **identifiants** de composants ; le serveur **recharge les
composants depuis la base** et **fige** `name` / `price` / `supplier` par item au
moment de l'achat. Le `totalAmount` est **recalculé côté serveur** (jamais reçu du
client). Le stock est vérifié à la création, mais décrémenté seulement **à la
confirmation du paiement**.

### 14. Créer une commande
- **POST** `/api/orders` — _authentifié, rôle **client**_
- Header : `Authorization: Bearer <token>`
- Body (JSON) :
  ```json
  {
    "items": [
      { "componentId": "<id_ESP32>", "quantity": 1 },
      { "componentId": "<id_DHT22>", "quantity": 2 }
    ],
    "shippingAddress": {
      "street": "12 rue des Capteurs",
      "city": "Monastir",
      "zip": "5000",
      "country": "Tunisie"
    }
  }
  ```
- Réponse `201` : la commande créée, `status: "pending"`, `totalAmount` calculé serveur.
- `404` si un composant est introuvable ; `400` si stock insuffisant ou body invalide.

### 15. Mes commandes
- **GET** `/api/orders/me` — _authentifié, rôle **client**_ — renvoie les commandes du client connecté.

### 16. Détail d'une commande
- **GET** `/api/orders/:id` — _authentifié ; **propriétaire** de la commande ou **admin**_
- Réponse `200` : la commande (user, items, supplier peuplés).
- `403` si la commande ne vous appartient pas ; `404` si introuvable.

---

## 💳 Endpoints — Paiement (Stripe, mode test)

> **Prérequis Stripe** — renseigne `STRIPE_SECRET_KEY` dans `server/.env` avec ta
> **clé secrète de test** (commence par `sk_test_`), récupérable sur
> <https://dashboard.stripe.com/test/apikeys>. Aucune vraie carte n'est utilisée.
> Si la clé est absente, le serveur démarre quand même et ces routes renvoient `503`.

**Comment un paiement réussi est simulé en mode test :** l'endpoint `confirm`
confirme le PaymentIntent côté serveur avec la carte de test Stripe `pm_card_visa`
(toujours acceptée en test), puis vérifie auprès de Stripe que le statut est
`succeeded` avant de marquer la commande payée. Pas besoin de frontend Stripe.js.

### 17. Créer un PaymentIntent
- **POST** `/api/payment/create-intent` — _authentifié, rôle **client**_
- Header : `Authorization: Bearer <token>`
- Body : `{ "orderId": "<id_commande>" }`
- Le montant est **recalculé depuis `order.totalAmount`** (jamais reçu du client).
- Réponse `201` :
  ```json
  {
    "success": true,
    "data": {
      "clientSecret": "pi_..._secret_...",
      "paymentIntentId": "pi_...",
      "amount": 37,
      "currency": "eur"
    },
    "message": "PaymentIntent créé"
  }
  ```
- `400` si la commande est déjà payée ; `404`/`403` selon la commande ; `503` si Stripe non configuré.

### 18. Confirmer le paiement
- **POST** `/api/payment/confirm` — _authentifié, rôle **client**_
- Header : `Authorization: Bearer <token>`
- Body : `{ "orderId": "<id_commande>" }`
- Effet : confirme le paiement auprès de Stripe ; si `succeeded`, passe la commande
  en `paid`, enregistre le `paymentIntentId` et **décrémente le stock** des composants.
- Réponse `200` : la commande mise à jour (`status: "paid"`). Idempotent : rappeler
  l'endpoint sur une commande déjà payée renvoie « Commande déjà payée » sans re-décrémenter.
- `400` si aucun PaymentIntent (appeler create-intent d'abord) ; `402` si le paiement n'aboutit pas.

---

## ⚡ Scénario de test Thunder Client (commande + paiement)

> **Pré-requis :** `npm run seed`, `STRIPE_SECRET_KEY` renseignée dans `.env`,
> serveur lancé (`npm run dev`).

1. **Login client** — **POST** `/api/auth/login`
   Body : `{ "email": "client@farhane.com", "password": "client123" }` → copie `data.token`.
2. **Récupérer des ids** — **GET** `/api/components?limit=100` → note l'`_id` de l'`ESP32 DevKit v1` (25 €) et du `Capteur DHT22` (6 €).
3. **Créer la commande** — **POST** `/api/orders` (header `Authorization: Bearer <token>`)
   Body : 1× ESP32 + 2× DHT22 + une `shippingAddress` (voir endpoint 14).
   → `201`, `status: "pending"`. **Vérifie le calcul serveur** : `totalAmount = 25 + 2×6 = 37`.
   Note l'`_id` de la commande (`data._id`).
4. **(Sécurité) Total non falsifiable** — refais la commande en ajoutant un faux `price`/`totalAmount` dans le body : la réponse renvoie toujours `37` (le serveur ignore ces champs).
5. **Créer le PaymentIntent** — **POST** `/api/payment/create-intent`
   Body : `{ "orderId": "<id_commande>" }` → `201`, `amount: 37`, `currency: "eur"`, un `clientSecret`.
6. **Confirmer le paiement** — **POST** `/api/payment/confirm`
   Body : `{ "orderId": "<id_commande>" }` → `200`, la commande passe à `status: "paid"`.
7. **Vérifier le passage à payé** — **GET** `/api/orders/<id_commande>` → `status: "paid"`, `paymentIntentId` renseigné.
8. **Vérifier le stock décrémenté** — **GET** `/api/components/<id_DHT22>` → le `stock` a baissé de 2 (et l'ESP32 de 1).
9. **Idempotence** — rappelle **POST** `/api/payment/confirm` sur la même commande → `200` « Commande déjà payée », stock inchangé.

> 💳 **Cartes de test Stripe** : la simulation utilise `pm_card_visa` (paiement réussi).
> Voir les autres cartes de test sur <https://docs.stripe.com/testing>.

---

## 🔁 Comment tester en 4 étapes (Postman)

1. `GET /api/health` → vérifie que le serveur tourne.
2. `POST /api/auth/login` avec un compte du seed → récupère le `token`.
3. `GET /api/auth/me` avec le header `Authorization: Bearer <token>` → ton profil.
4. `GET /api/auth/admin-check` avec un token client (403) puis admin (200).

---

## ⚡ Scénario de test Thunder Client (catalogue)

Crée une collection « Farhane — Catalogue » et enchaîne ces requêtes :

1. **GET** `http://localhost:5000/api/components`
   → `200`, tu vois les composants du seed (8 au total) avec `total`, `pages`.
2. **GET** `http://localhost:5000/api/components?category=board&sort=price`
   → `200`, uniquement les 2 cartes, triées par prix croissant.
3. **GET** `http://localhost:5000/api/components?search=ESP32`
   → `200`, l'ESP32 DevKit remonte (recherche texte).
4. **POST** `http://localhost:5000/api/auth/login`
   Body : `{ "email": "supplier@farhane.com", "password": "supplier123" }`
   → copie `data.token` (fournisseur approuvé).
5. **POST** `http://localhost:5000/api/components`
   Header : `Authorization: Bearer <token_fournisseur>`
   Body : voir l'exemple « fournisseur » de l'endpoint 8.
   → `201`. Note l'`_id` retourné, et vérifie que `supplier` est bien TechParts SARL.
6. **PUT** `http://localhost:5000/api/components/<id_créé>`
   Header : `Authorization: Bearer <token_fournisseur>`
   Body : `{ "price": 5 }` → `200`, le prix change.
7. **Test ownership** : connecte-toi en `client@farhane.com` (endpoint login),
   puis **POST** un composant avec ce token → `403` (un client ne peut pas créer).
8. **DELETE** `http://localhost:5000/api/components/<id_créé>`
   Header : `Authorization: Bearer <token_fournisseur>` → `200` (le propriétaire supprime).

> Pour voir un `403` d'ownership entre fournisseurs : connecte-toi en
> `supplier2@farhane.com` (2ᵉ fournisseur approuvé du seed) et tente de modifier
> (PUT) un composant appartenant au premier fournisseur → `403`.

---

## ⭐ Endpoints — Avis (reviews)

Base URL : `http://localhost:5000`

Un avis lie un **client** à un **composant** (note `1-5` + commentaire optionnel).
Règles métier :
- **Achat requis** — on ne peut noter qu'un composant **réellement acheté**
  (commande au statut `paid` contenant ce composant). Sinon → `403`.
- **Un seul avis par client et par composant** (index unique du modèle). Un second
  avis renvoie un `409` clair, **jamais un crash 500**.
- **Ownership** — seul l'**auteur** (ou un **admin**) peut modifier/supprimer un avis.
- À chaque ajout/modif/suppression, `ratingAverage` et `ratingCount` du composant
  sont **recalculés** automatiquement.

### 19. Laisser un avis
- **POST** `/api/components/:id/reviews` — _authentifié, rôle **client**_
- Header : `Authorization: Bearer <token>`
- Body : `{ "rating": 4, "comment": "Très bon capteur" }` (`comment` optionnel)
- Réponse `201` : l'avis créé (`user` peuplé : `name`).
- `403` si le composant n'a pas été acheté ; `409` si un avis existe déjà ;
  `404` si le composant n'existe pas ; `400` si `rating` hors `1-5`.

### 20. Liste des avis d'un composant
- **GET** `/api/components/:id/reviews` — _public_
- Réponse `200` : `data = [ ... ]`, les avis les plus récents d'abord (`user` peuplé).

### 21. Modifier son avis
- **PUT** `/api/reviews/:id` — _authentifié ; **auteur** de l'avis ou **admin**_
- Body : champs à modifier — `{ "rating": 2, "comment": "..." }`
- Réponse `200` : l'avis mis à jour (les notes du composant sont recalculées).
- `403` si l'avis ne vous appartient pas ; `404` si introuvable.

### 22. Supprimer un avis
- **DELETE** `/api/reviews/:id` — _authentifié ; **auteur** de l'avis ou **admin**_
- Réponse `200` : `data = { id }` (les notes du composant sont recalculées).
- `403` si l'avis ne vous appartient pas ; `404` si introuvable.

---

## 🏭 Endpoints — Dashboard Fournisseur

Base URL : `http://localhost:5000`

Réservé au rôle **supplier** dont le profil est **approuvé**. Le `Supplier` est
**toujours déduit du token** : un fournisseur ne voit **QUE ses propres données**,
jamais celles d'un autre. Un fournisseur `pending` reçoit `403`.

### 23. Mes composants
- **GET** `/api/supplier/components` — _supplier approuvé_
- Réponse `200` : la liste de **ses** composants uniquement.

### 24. Mes commandes
- **GET** `/api/supplier/orders` — _supplier approuvé_
- Réponse `200` : les commandes contenant **ses** composants. Dans chaque commande,
  les `items` sont **filtrés aux siens** (jamais les produits des autres
  fournisseurs), avec un `supplierSubtotal` propre.

### 25. Mes statistiques
- **GET** `/api/supplier/stats` — _supplier approuvé_
- Réponse `200` :
  ```json
  {
    "componentCount": 6,
    "orderCount": 1,
    "paidOrderCount": 1,
    "totalSales": 6,
    "lowStock": [{ "_id": "...", "name": "...", "stock": 4 }]
  }
  ```
  `totalSales` = somme des `price × quantity` de **ses** items dans les commandes
  **payées** ; `lowStock` = ses composants dont le `stock ≤ 5`.

---

## 🛡️ Endpoints — Dashboard Admin

Base URL : `http://localhost:5000`

Toutes ces routes sont réservées au rôle **admin** (sinon `403`).

### 26. Liste des fournisseurs
- **GET** `/api/admin/suppliers` — _admin_ — filtre optionnel `?status=pending|approved|rejected`
- Réponse `200` : les fournisseurs (avec le compte `user` peuplé : `name`, `email`).

### 27. Approuver / refuser un fournisseur
- **PATCH** `/api/admin/suppliers/:id/approve` — passe le `status` à `approved`.
- **PATCH** `/api/admin/suppliers/:id/reject` — passe le `status` à `rejected`.
- Réponse `200` : le fournisseur mis à jour. `404` si l'id n'existe pas.

### 28. Liste des utilisateurs
- **GET** `/api/admin/users` — _admin_ — filtre optionnel `?role=client|supplier|admin`
- Réponse `200` : tous les utilisateurs (le `password` n'est **jamais** renvoyé).

### 29. Toutes les commandes
- **GET** `/api/admin/orders` — _admin_
- Réponse `200` : toutes les commandes (user, items, supplier peuplés).

### 30. Statistiques globales
- **GET** `/api/admin/stats` — _admin_
- Réponse `200` :
  ```json
  {
    "userCount": 5,
    "suppliers": { "pending": 1, "approved": 2, "rejected": 0 },
    "componentCount": 8,
    "orderCount": 1,
    "paidOrderCount": 1,
    "totalRevenue": 6
  }
  ```
  `totalRevenue` = somme des `totalAmount` des commandes **payées**.

---

## ⚡ Scénario de test Thunder Client — Avis

> **Pré-requis :** `npm run seed`. Comme l'avis exige un **achat payé**, il faut une
> commande au statut `paid`. Avec Stripe configuré, suis le scénario « commande +
> paiement » jusqu'à `status: paid`. Sans Stripe, passe la commande à `paid`
> manuellement (MongoDB Compass : `orders` → ta commande → `status: "paid"`).

1. **Login client** — `POST /api/auth/login` (`client@farhane.com` / `client123`) → token.
2. **Trouver un composant** — `GET /api/components?search=DHT22` → note l'`_id`.
3. **Avis SANS achat (négatif)** — `POST /api/components/<id>/reviews`
   (token client) Body `{ "rating": 5 }` → **403** « …que vous avez achetés ».
4. **Acheter + payer** — crée une commande avec ce composant (endpoint 14) puis
   paie-la (endpoints 17-18) **ou** force `status: paid` en base.
5. **Avis APRÈS achat** — rejoue l'étape 3 → **201**, avis créé (`user.name` peuplé).
6. **Vérifier le recalcul** — `GET /api/components/<id>` → `ratingCount: 1`,
   `ratingAverage` = ta note.
7. **Doublon (négatif)** — rejoue le POST → **409** « Vous avez déjà laissé un avis… ».
8. **Liste publique** — `GET /api/components/<id>/reviews` (sans token) → **200**, 1 avis.
9. **Ownership (négatif)** — login `supplier@farhane.com`, puis
   `PUT /api/reviews/<idAvis>` avec ce token → **403** (pas l'auteur).
10. **Modifier (auteur)** — `PUT /api/reviews/<idAvis>` (token client) `{ "rating": 2 }`
    → **200** ; re-`GET` le composant → `ratingAverage` recalculé à `2`.
11. **Supprimer** — `DELETE /api/reviews/<idAvis>` (token client ou admin) → **200** ;
    re-`GET` le composant → `ratingCount: 0`, `ratingAverage: 0`.

---

## ⚡ Scénario de test Thunder Client — Dashboard Fournisseur

> **Pré-requis :** `npm run seed`. Pour des stats de vente non nulles, aie au moins
> une commande **payée** contenant un composant du fournisseur 1 (voir scénario Avis).

1. **Login fournisseur 1** — `POST /api/auth/login` (`supplier@farhane.com` / `supplier123`) → token1.
2. **Ses composants** — `GET /api/supplier/components` (token1) → **200**, **6** composants
   (tous TechParts SARL).
3. **Ses stats** — `GET /api/supplier/stats` (token1) → `componentCount: 6` ; si une
   vente payée existe, `totalSales` et `paidOrderCount` > 0.
4. **Ses commandes** — `GET /api/supplier/orders` (token1) → les commandes contenant
   ses composants, `items` filtrés aux siens.
5. **Login fournisseur 2** — `POST /api/auth/login` (`supplier2@farhane.com` / `supplier123`) → token2.
6. **CLOISONNEMENT** — `GET /api/supplier/components` (token2) → **200**, **2** composants
   (IoT Store) — **aucun** composant du fournisseur 1. C'est la preuve qu'un
   fournisseur ne voit pas les données d'un autre.
7. **Alerte stock** — `GET /api/supplier/stats` (token2) → `lowStock` contient
   « Capteur ultrason HC-SR04 » (stock 4).
8. **Fournisseur en attente (négatif)** — login `pending@farhane.com`, puis
   `GET /api/supplier/components` → **403** « …doit être approuvé ».
9. **Mauvais rôle (négatif)** — avec un token **client**,
   `GET /api/supplier/components` → **403** (rôle insuffisant).

---

## ⚡ Scénario de test Thunder Client — Dashboard Admin

> **Pré-requis :** `npm run seed`.

1. **Login admin** — `POST /api/auth/login` (`admin@farhane.com` / `admin123`) → tokenAdmin.
2. **Liste fournisseurs** — `GET /api/admin/suppliers` (tokenAdmin) → **200**, 3 fournisseurs.
3. **Filtre pending** — `GET /api/admin/suppliers?status=pending` → 1 résultat
   (Pending Supplier) ; note son `_id`.
4. **Approuver** — `PATCH /api/admin/suppliers/<id>/approve` (tokenAdmin) → **200**,
   `status: "approved"`. (Le fournisseur peut désormais accéder à son dashboard.)
5. **Refuser** — `PATCH /api/admin/suppliers/<id>/reject` → **200**, `status: "rejected"`.
6. **Utilisateurs** — `GET /api/admin/users` (tokenAdmin) → **200**, 5 users, **sans** `password`.
7. **Filtre rôle** — `GET /api/admin/users?role=supplier` → les 3 fournisseurs.
8. **Toutes les commandes** — `GET /api/admin/orders` (tokenAdmin) → **200**, toutes les commandes.
9. **Stats globales** — `GET /api/admin/stats` (tokenAdmin) → `userCount`, `suppliers`
   (par statut), `componentCount`, `orderCount`, `totalRevenue`.
10. **CLOISONNEMENT (négatif)** — avec un token **client** puis **supplier**, appelle
    n'importe quelle route `/api/admin/...` → **403** à chaque fois. Preuve qu'aucun
    rôle non-admin n'accède aux données d'administration.

---

## ✅ Conventions

- Réponses normalisées partout : `{ success, data, message }`.
- `asyncHandler` + middleware d'erreurs centralisé (pas de try/catch dans les controllers).
- Validation des entrées via `express-validator` (`register` et `login`).
- JWT renvoyé dans le **body** au login (Bearer token), simple à tester dans Postman.
- Hachage du mot de passe géré dans le `pre('save')` du modèle `User` (bcryptjs).
- `helmet` + `cors` activés ; secrets dans `server/.env` uniquement (jamais committé).

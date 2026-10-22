# Farhane Labs — Document de Planification (Partie 1)

> Marketplace de composants et de kits électroniques (Arduino / ESP32 / capteurs)
> avec configurateur intelligent de compatibilité.
> **Auteur :** Montassar Farhane — Polytech Monastir
> **Type :** Projet personnel full-stack (MERN)

---

## 1. Présentation du projet

**Farhane Labs** est une plateforme e-commerce spécialisée dans la vente de composants et de kits électroniques (cartes Arduino/ESP32, capteurs, modules, accessoires). Sa particularité — et sa valeur différenciante — est un **configurateur intelligent** : l'utilisateur compose son propre kit, et le système vérifie automatiquement la **compatibilité technique** des composants (tension, interface, broches), calcule le prix total et génère un récapitulatif de câblage.

Le projet fonctionne comme une **marketplace** : plusieurs fournisseurs proposent leurs produits sur une plateforme commune, supervisée par un administrateur.

### Objectifs

- Démontrer la maîtrise du développement web **full-stack** (MERN).
- Mettre en valeur le parcours **systèmes embarqués / IoT** via la logique métier du configurateur.
- Construire une application **professionnelle, structurée et sécurisée**, proche d'un produit réel.

### Pourquoi ce projet (contexte académique)

Il prolonge les compétences acquises sur le projet MediKanban (architecture MVC, JWT, design patterns, API REST) tout en ajoutant des briques nouvelles et valorisantes : **gestion multi-rôles**, **logique métier originale** et **paiement en ligne**.

---

## 2. Stack technique

### Langages

| Couche | Langage |
|---|---|
| Frontend | JavaScript (ES6+), JSX, HTML5, CSS3 |
| Backend | JavaScript (Node.js) |
| Base de données | MongoDB (NoSQL, documents JSON) |

### Frameworks & bibliothèques principales

**Frontend (React)**
- **React** — bibliothèque UI
- **React Router** — navigation et routes protégées
- **Context API** — état global (authentification, panier, configurateur)
- **Axios** — appels à l'API REST
- **Tailwind CSS** — framework CSS utilitaire (styling)
- **DaisyUI** — composants prêts à l'emploi basés sur Tailwind (boutons, modals, cartes, navbars…)

> **Choix de design :** Tailwind + DaisyUI plutôt que Bootstrap. On garde la rapidité des composants tout faits, mais 100 % Tailwind — pas de conflit de classes ni de reset CSS, un seul framework à charger, et une compétence plus valorisée aujourd'hui. **Bootstrap n'est pas utilisé** pour éviter les collisions entre les deux systèmes.

**Backend (Node.js)**
- **Express** — framework serveur / API REST
- **Mongoose** — ODM pour MongoDB (modèles, validation, relations)
- **jsonwebtoken (JWT)** — authentification par token
- **bcrypt** — hachage des mots de passe
- **express-validator** — validation des entrées
- **multer** + **Cloudinary** — upload et stockage d'images
- **Stripe** — paiement en ligne (mode test)
- **dotenv** — variables d'environnement
- **cors**, **helmet** — sécurité

### Outils

Git / GitHub (versioning), VS Code, Postman (test API), MongoDB Compass (visualisation BD), npm.

---

## 3. Architecture générale

Application **client-serveur découplée** :
le **frontend React** (SPA) communique avec le **backend Express** via une **API REST**, qui lit/écrit dans **MongoDB**. Le paiement passe par l'API Stripe.

```
┌──────────────┐      requêtes HTTP /JSON      ┌──────────────┐
│   FRONTEND   │  ─────────────────────────▶   │   BACKEND    │
│   React SPA  │   ◀─────────────────────────  │ Node/Express │
└──────────────┘        réponses JSON          └──────┬───────┘
                                                       │ Mongoose
                                                ┌──────▼───────┐
                                                │   MongoDB    │
                                                └──────────────┘
        + intégration Stripe (paiement)  + Cloudinary (images)
```

### Architecture en couches (backend)

On applique une séparation claire des responsabilités, appuyée sur les patterns **MVC**, **Repository** et **Middleware** :

```
Requête → Route → Middleware (auth/validation) → Controller → Service → Repository → Modèle (Mongoose) → MongoDB
```

- **Route** : définit l'endpoint et la méthode HTTP.
- **Middleware** : authentification (JWT), autorisation (rôle), validation, gestion d'erreurs.
- **Controller** : reçoit la requête, appelle le service, renvoie la réponse.
- **Service** : contient la logique métier (ex. le moteur de compatibilité).
- **Repository** : isole l'accès aux données (toutes les requêtes Mongoose).
- **Modèle** : schéma Mongoose.

### Patterns utilisés

| Pattern | Où / pourquoi |
|---|---|
| MVC | Organisation générale du backend |
| Repository | Isoler l'accès aux données de la logique métier |
| Middleware | Authentification, rôles, validation, erreurs |
| Context (Provider) | État global côté React |
| Strategy (léger) | Règles de compatibilité du configurateur |

---

## 4. Rôles et utilisateurs

Trois rôles, gérés par le champ `role` du modèle User et contrôlés par un middleware d'autorisation.

### Client
Parcourt le catalogue, utilise le configurateur, gère son panier, passe commande et paie, suit ses commandes, laisse des avis.

### Fournisseur (Supplier)
Possède un profil société (validé par l'admin avant de vendre). Gère **uniquement ses propres** composants (CRUD, stock, prix) et consulte les commandes qui le concernent via un tableau de bord dédié.

### Admin
Supervise l'ensemble : valide/refuse les fournisseurs, gère les catégories, modère les avis, consulte tous les utilisateurs et toutes les commandes, accède aux statistiques.

### Matrice des permissions

| Action | Client | Fournisseur | Admin |
|---|:---:|:---:|:---:|
| Parcourir le catalogue | ✓ | ✓ | ✓ |
| Utiliser le configurateur | ✓ | ✓ | ✓ |
| Passer commande / payer | ✓ | — | — |
| Laisser un avis | ✓ | — | — |
| CRUD de SES composants | — | ✓ | ✓ |
| Voir SES commandes (fournisseur) | — | ✓ | ✓ |
| Valider un fournisseur | — | — | ✓ |
| Gérer catégories / modération | — | — | ✓ |
| Voir tous les utilisateurs/commandes | — | — | ✓ |

### Comptes de démonstration à prévoir
1 admin (toi) · 2-3 fournisseurs (avec produits) · 3-5 clients (avec commandes et avis).

---

## 5. Modèle de données (vue d'ensemble)

Six entités principales. Les détails complets (schémas Mongoose) feront l'objet de la partie 2.

| Modèle | Rôle | Relations clés |
|---|---|---|
| **User** | Compte (client/fournisseur/admin) | 1—1 Supplier (si fournisseur) |
| **Supplier** | Profil société d'un fournisseur | appartient à un User |
| **Component** | Produit (carte, capteur, module…) | référence un Supplier |
| **Kit** | Ensemble de composants (pré-fait ou config. sauvegardée) | référence des Components |
| **Order** | Commande | référence User + Components |
| **Review** | Avis / note sur un composant | référence User + Component |

**Champ central pour la compatibilité** — chaque `Component` porte un objet `specs` :
`{ voltage, interface (I2C/SPI/UART/analogique/digital), pinsUsed }`, et chaque carte de base déclare `{ voltagesSupported, pinsAvailable, busesAvailable }`.

---

## 6. Fonctionnalités par module

### Authentification & comptes
Inscription, connexion (JWT), déconnexion, profil, mot de passe haché, routes protégées par rôle.

### Catalogue
Liste des composants, recherche par mot-clé, filtres (catégorie, prix, fournisseur, tension), tri, pagination, fiche produit détaillée avec avis.

### Configurateur intelligent (pièce maîtresse)
Sélection d'une carte de base, ajout de composants, **validation de compatibilité en temps réel** (tension, broches, bus), calcul automatique du prix, récapitulatif/schéma de câblage, sauvegarde de la configuration en tant que Kit.

### Panier & commande
Panier persistant, modification des quantités, récapitulatif, adresse de livraison, création de commande.

### Paiement
Intégration **Stripe (mode test)**, confirmation de paiement, mise à jour du statut de la commande.

### Espace Client
Historique et suivi des commandes (statut), kits sauvegardés, gestion du profil, avis laissés.

### Espace Fournisseur
Tableau de bord : CRUD de ses composants, gestion du stock, suivi des commandes le concernant.

### Espace Admin
Validation des fournisseurs, gestion des catégories, modération des avis, vue globale utilisateurs/commandes, statistiques simples.

---

## 7. Le moteur de compatibilité (logique métier clé)

C'est l'élément qui distingue le projet. Implémenté dans un **service** dédié côté backend (et reflété côté React pour le retour en temps réel).

**Règles validées à chaque ajout de composant :**
1. **Tension** — la tension du composant est-elle supportée par la carte ?
2. **Broches** — reste-t-il assez de broches libres du bon type ?
3. **Bus** — le bus requis (I2C/SPI/UART) est-il disponible / non saturé ?
4. **Conflits** — pas de double affectation d'une même broche.

**Sortie :** statut `compatible / avertissement / incompatible` + message explicatif (ex. « Capteur 5V incompatible avec ESP32 en 3.3V »).

> Cette logique sera détaillée avec exemples concrets dans la partie 2.

---

## 8. API REST — principaux endpoints

| Méthode | Endpoint | Accès |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/components` | public |
| GET | `/api/components/:id` | public |
| POST | `/api/components` | fournisseur/admin |
| PUT/DELETE | `/api/components/:id` | propriétaire/admin |
| POST | `/api/configurator/validate` | authentifié |
| POST | `/api/orders` | client |
| GET | `/api/orders/me` | client |
| POST | `/api/payment/create-intent` | client |
| PATCH | `/api/suppliers/:id/approve` | admin |
| GET | `/api/admin/stats` | admin |

Convention : réponses JSON normalisées, codes HTTP standards (200/201/400/401/403/404/500).

---

## 9. Sécurité

- Mots de passe hachés (**bcrypt**).
- Authentification par **JWT** ; à stocker côté client de préférence en cookie httpOnly (amélioration vs localStorage).
- **Middleware d'autorisation** par rôle sur les routes sensibles.
- **Validation** systématique des entrées (express-validator).
- **helmet** + **cors** configurés ; variables sensibles dans `.env` (jamais commitées).
- Stripe : seules les **clés de test** sont utilisées, jamais de vraie carte.

---

## 10. Déploiement (cible)

- **Frontend** : Netlify ou Vercel.
- **Backend** : Render ou Railway.
- **Base de données** : MongoDB Atlas (cloud gratuit).
- **Images** : Cloudinary.
- Variables d'environnement configurées sur chaque service.

---

## 11. Plan de développement par étapes

| Phase | Contenu | Livrable |
|---|---|---|
| **0. Setup** | Repo Git, structure dossiers, connexion MongoDB, `.env` | Projet qui démarre |
| **1. Auth & rôles** | Inscription/connexion JWT, middleware de rôles | Comptes fonctionnels |
| **2. Modèles & catalogue** | Modèles Mongoose, CRUD composants, liste + fiche produit | Catalogue navigable |
| **3. Recherche & filtres** | Recherche, filtres, tri, pagination | Catalogue complet |
| **4. Configurateur** ★ | Moteur de compatibilité + UI configurateur | Fonction phare |
| **5. Panier & commande** | Panier persistant, tunnel de commande | Commande créée |
| **6. Paiement** | Intégration Stripe (test) | Paiement test OK |
| **7. Espaces dédiés** | Dashboards Client / Fournisseur / Admin | Multi-rôles complet |
| **8. Finitions** | Avis, responsive, gestion d'erreurs, README | Projet présentable |
| **9. Déploiement** | Mise en ligne (Atlas + Render + Netlify) | Lien public |

★ La phase 4 est le cœur du projet : à soigner particulièrement.

---

## 12. Évolutions futures (à mentionner à l'oral)

- Paiement **réparti** entre fournisseurs (Stripe Connect).
- **Schéma de câblage visuel** interactif généré automatiquement.
- Notifications **temps réel** (Socket.IO) pour le suivi de commande.
- Recommandations de composants basées sur les configurations populaires.
- Application mobile (React Native).

---

## Prochaine étape — Partie 2

Détail des **modèles Mongoose complets** (User, Supplier, Component, Kit, Order, Review) avec relations et champ de rôle, prêts à coder.

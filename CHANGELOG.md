# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


---

## [0.6.0] - 2026-06-14

### ✅ Ajouté (Added)

#### J6 - Documentation Swagger
- Configuration Swagger OpenAPI 3.0 (`src/config/swagger.ts`)
- Swagger UI interactif accessible sur `/api-docs`
- Documentation JSDoc complète pour tous les endpoints
  - Auth : register, login, refresh, logout, me
  - Users : getAllUsers, getUserById, updateUserRole, deleteUser
  - Paiement : initier, webhook, status, history, success, cancel
- Schémas de composants réutilisables (User, Transaction, Error)
- Schéma de sécurité bearerAuth pour JWT
- Tags de regroupement (Auth, Users, Paiement)
- CSS personnalisé et favicon
- Titre personnalisé "AfriStarter API Documentation"

### 🔧 Amélioré (Improved)
- README mis à jour avec tous les 15 endpoints
- README : remplacement "FedaPay SDK" par "FedaPay REST API"
- README : ajout badges de sécurité (0 vulnérabilités npm audit)
- README : documentation HMAC-SHA256 webhook verification
- README : validation téléphone burkinabè mentionnée
- README : pagination documentée pour /users et /paiement/history
- README : 5 exemples cURL (register, login, payment, history, users)
- README : 12 variables d'environnement documentées
- README : 10 tests de validation listés
- README : formatage markdown corrigé (tableaux, code blocks)

### 📊 Métriques v0.6.0

| Métrique | Valeur |
|----------|--------|
| Lignes de code (TypeScript) | ~1500 |
| Nombre d'endpoints | 15 |
| Endpoints documentés Swagger | 15 (100%) |
| Jours complétés | 6 / 10 |
| Progression globale | 60% |
| Tests manuels effectués | ✅ J3 + J4 + J5 validés |
| Vulnérabilités npm audit | 0 |

## [0.5.0] - 2026-06-13

### ✅ Ajouté (Added)

#### J4 - Gestion utilisateurs admin
- `GET /api/v1/users` - Liste des utilisateurs avec pagination (admin seulement)
- `GET /api/v1/users/:id` - Détails d'un utilisateur (admin seulement)
- `PATCH /api/v1/users/:id/role` - Mise à jour du rôle utilisateur (admin seulement)
- `DELETE /api/v1/users/:id` - Suppression d'utilisateur (admin seulement)
- Middleware `isAdmin` pour protection des routes admin
- Middleware `errorHandler` pour gestion centralisée des erreurs
- Configuration base de données centralisée (`config/database.ts`)
- Extension TypeScript pour `Express.Request` (ajout de `req.user`)
- Protection contre l'auto-suppression (admin ne peut pas supprimer son propre compte)

### 🔧 Corrigé (Fixed)
- Correction des types TypeScript pour compatibilité avec Prisma UUID
- Correction des sélecteurs Prisma (champs `fullName` et `updatedAt` inexistants)

---

## [0.4.0] - 2026-06-12

### ✅ Ajouté (Added)

#### J3 - Authentification JWT complète
- Inscription utilisateur (`POST /api/v1/auth/register`)
- Connexion avec JWT (`POST /api/v1/auth/login`)
- Refresh token (`POST /api/v1/auth/refresh`)
- Déconnexion avec invalidation tokenVersion (`POST /api/v1/auth/logout`)
- Récupération profil connecté (`GET /api/v1/auth/me`)
- Middleware `auth` pour vérification JWT
- Middleware `validate` pour validation Zod automatique
- TokenVersion pour invalidation des refresh tokens au logout

#### Sécurité
- Helmet pour en-têtes HTTP sécurisés
- CORS configurable
- Validation Zod pour toutes les entrées
- Hash bcrypt pour mots de passe
- Rate limiting (morgan pour logs)

---

## [0.3.0] - 2026-06-12

### ✅ Ajouté (Added)

#### J2 - Base de données + Prisma
- Modèle `User` (id UUID, email, password, role, tokenVersion, createdAt)
- Modèle `Transaction` (id UUID, userId, amount, phone, status, fedapayId, createdAt)
- Enums `Role` (USER, ADMIN) et `Status` (PENDING, SUCCESS, FAILED)
- Migration initiale Prisma
- Seed automatique (admin + user test)
- Docker Compose avec PostgreSQL (port 5433)

---

## [0.2.0] - 2026-06-12

### ✅ Ajouté (Added)

#### J1 - Initialisation du projet
- Structure de dossiers `src/` (controllers, middlewares, routes, services, utils, validations)
- Configuration TypeScript (`tsconfig.json`)
- Dépendances installées (Express, Prisma, JWT, bcrypt, Zod, etc.)
- Fichiers de configuration (`.env.example`, `.gitignore`)
- Nodemon pour développement

---

## [0.1.0] - 2026-06-11

### ✅ Ajouté (Added)

#### J0 - Préparation
- Création du repository GitHub privé
- Documentation de base (README, ROADMAP, CHANGELOG)
- Compte FedaPay sandbox créé

---

## [1.0.0] - À venir (prévu 2026-06-18)

### Fonctionnalités restantes

#### J5 - Paiement Mobile Money (FedaPay)
- [ ] Configuration FedaPay SDK (`config/fedapay.ts`)
- [ ] Service paiement (`services/paiement.service.ts`)
- [ ] Controller paiement (`controllers/paiementController.ts`)
- [ ] Validation Zod (`validations/paiementValidation.ts`)
- [ ] Routes paiement (`routes/paiementRoutes.ts`)
  - `POST /api/v1/paiement/initier`
  - `POST /api/v1/paiement/webhook`
  - `GET /api/v1/paiement/status/:id`

#### J6 - Documentation Swagger
- [ ] Installation Swagger (`swagger-ui-express`, `swagger-jsdoc`)
- [ ] Configuration Swagger (`config/swagger.ts`)
- [ ] Documentation JSDoc pour tous les endpoints
- [ ] Swagger UI accessible sur `/api-docs`

#### J7 - Docker + Scripts
- [ ] Dockerfile multi-stage (node:18-alpine)
- [ ] Script `scripts/setup.sh` (installation automatique)
- [ ] Script npm `npm run setup`
- [ ] Test sur machine vierge

#### J8 - Tests + Sécurité
- [ ] Tests manuels Postman (tous les endpoints)
- [ ] Script `scripts/change-admin-password.ts`
- [ ] Script npm `npm run change-admin-password`
- [ ] Vérification gestion d'erreurs

#### J9 - Vidéo + Préparation vente
- [ ] Enregistrement vidéo démo (max 3 min)
- [ ] Captures d'écran (Swagger, Postman, terminal)
- [ ] Rédaction annonce Chariow
- [ ] Création ZIP (`git archive`)
- [ ] Tag GitHub `v1.0.0`

#### J10 - Publication
- [ ] Publication sur Chariow (3 offres)
- [ ] Préparation réponses types support
- [ ] Création email support
- [ ] Promotion (groupes Facebook, WhatsApp)

---

## [1.1.0] - À venir (prévu Q3 2026)

### Fonctionnalités planifiées

#### 🔜 Nouvelles fonctionnalités
- [ ] Envoi email de bienvenue (Nodemailer + templates)
- [ ] Tests unitaires avec Jest (couverture > 80%)
- [ ] Tests d'intégration avec Supertest
- [ ] Redis pour cache (optionnel, désactivable)
- [ ] Deuxième agrégateur Mobile Money (Hub2 ou PayTech)
- [ ] Export CSV des transactions
- [ ] Dashboard admin avec métriques (API seulement)

#### 🔧 Améliorations
- [ ] Compression Gzip/Brotli
- [ ] Logging structuré (JSON pour ingestion ELK)
- [ ] Rate limiting par utilisateur (au lieu de IP)
- [ ] Webhook retry avec backoff exponentiel
- [ ] Health check plus détaillé (DB, Redis, FedaPay)

---

## [2.0.0] - Fullstack (prévu Q1 2027)

### 🎨 Frontend (Next.js)
- Next.js 14+ (App Router)
- Tailwind CSS + Shadcn/ui
- React Query (tanstack-query)
- Dashboard utilisateur + admin

### ⚙️ Backend (nouveautés)
- Upload fichiers (Cloudinary ou AWS S3)
- WebSockets (Socket.io) pour notifications temps réel
- 2FA (authentification deux facteurs)
- OAuth (Google, GitHub)

---

## 📊 Métriques actuelles (v0.5.0)

| Métrique | Valeur |
|----------|--------|
| Lignes de code (TypeScript) | ~800 |
| Nombre d'endpoints | 7 |
| Jours complétés | 4 / 10 |
| Progression globale | 40% |
| Tests manuels effectués | ✅ J3 + J4 validés |

---

## 📝 Guide des versions

| Version | Statut | Support | Dernière mise à jour |
|---------|--------|---------|---------------------|
| 0.x.x | 🚧 En développement | Features en cours | 2026-06-13 |
| 1.0.0 | 📅 Planifié | Version stable complète | ~2026-06-18 |
| 1.1.x | 📅 Planifié | Nouvelles fonctionnalités | Q3 2026 |
| 2.0.0 | 📅 Planifié | Fullstack | Q1 2027 |

---

Dernière mise à jour : 2026-06-13
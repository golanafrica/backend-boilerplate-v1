# 🚀 Backend Boilerplate AfriStarter v1

**API REST prête à l'emploi pour applications web et mobile**  
*Paiement Mobile Money (Orange Money, MTN Money, Moov Money) intégré*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-brightgreen)](https://docs.npmjs.com/cli/audit)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Pourquoi ce boilerplate ?

| Problème | Solution |
|----------|----------|
| ⏳ **Gagner des semaines de développement** | Code prêt à l'emploi, rien à réinventer |
| 🔐 **Sécurité souvent négligée** | JWT refresh, tokenVersion, Helmet, rate limiting, **0 vulnérabilité npm audit** |
| 💰 **Intégration Mobile Money complexe** | FedaPay déjà configuré avec webhook et signature HMAC-SHA256 |
| 🐘 **Environnement différent entre dev/prod** | Docker Compose prêt à l'emploi |
| 📖 **Documentation absente** | Swagger interactif, README complet, guide IA |

---

## 🛠️ Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| Runtime | Node.js 18+ |
| Langage | TypeScript (strict) |
| Framework | Express.js |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Validation | Zod |
| Authentification | JWT (access + refresh) |
| Paiement | **FedaPay REST API** (client sécurisé personnalisé) |
| Documentation | Swagger (OpenAPI 3.0) |
| Conteneurisation | Docker + docker-compose |

> 💡 **Pourquoi un client REST personnalisé FedaPay ?**  
> Le SDK officiel `fedapay` dépend d'une version vulnérable d'axios (22 CVEs). Nous avons créé notre propre client utilisant `axios` à jour, avec vérification de signature HMAC-SHA256 des webhooks.

---

## ⚡ Fonctionnalités

### 🔐 Authentification
- Inscription / Connexion
- Access token (15 min) + Refresh token (7 jours)
- Logout avec invalidation (tokenVersion, sans Redis)
- Rafraîchissement automatique des tokens
- Validation des mots de passe complexes (8+ caractères, majuscule, minuscule, chiffre)

### 👑 Rôles et permissions
- **User** : accès à son profil, historique de paiements
- **Admin** : CRUD complet des utilisateurs (liste paginée, détails, changement de rôle, suppression)

### 💰 Paiement Mobile Money
- Initier paiement (Orange Money, MTN Money, Moov Money)
- Webhook FedaPay avec **vérification de signature HMAC-SHA256**
- Validation des numéros de téléphone **burkinabè** (format `07XXXXXXXX` ou `+22607XXXXXXXX`)
- Montants en FCFA (100 à 5 000 000 FCFA)
- Historique paginé des transactions
- Table `Transaction` avec statuts : PENDING → SUCCESS/FAILED

### 🛡️ Sécurité
- Helmet (en-têtes HTTP sécurisés)
- CORS configurable via variable d'environnement
- Rate limiting (100 requêtes/15 min par IP)
- Validation Zod (protection contre les injections)
- Hash bcrypt pour mots de passe
- **0 vulnérabilité npm audit** (client FedaPay personnalisé)
- Limite de body JSON à 10kb (protection DoS)
- Logging des tentatives de validation échouées
- Vérification HMAC-SHA256 des webhooks FedaPay
- Masquage des erreurs en production

### 📚 Documentation
- **Swagger UI interactif** sur `/api-docs` (testez l'API depuis le navigateur)
- README complet avec exemples cURL
- Guide IA (Cursor/Copilot prêt)

### 🐳 Déploiement
- Docker Compose (app + PostgreSQL en une commande)
- Script `npm run setup` (installation automatique)
- Seed admin par défaut (`admin@example.com` / `Admin123`)
- Script `npm run change-admin-password` pour sécuriser avant production

---

## 🚀 Installation (3 commandes)

```bash
# 1. Cloner le projet
git clone https://github.com/golanafrica/backend-boilerplate-v1.git
cd backend-boilerplate-v1

# 2. Lancer l'installation automatique
npm run setup

# 3. Accéder à l'API
curl http://localhost:3000/health

⚠️ Docker requis : assurez-vous que Docker est installé et démarré.
📡 API Endpoints
🔐 Authentification
Méthode
Endpoint
Description
Auth
POST
/api/v1/auth/register
Créer un compte
❌
POST
/api/v1/auth/login
Se connecter
❌
POST
/api/v1/auth/logout
Se déconnecter
✅
POST
/api/v1/auth/refresh
Rafraîchir token
❌
GET
/api/v1/auth/me
Profil connecté
✅
👑 Gestion utilisateurs (Admin)
Méthode
Endpoint
Description
Auth
GET
/api/v1/users
Liste paginée des users
🔐 Admin
GET
/api/v1/users/:id
Détails d'un user
🔐 Admin
PATCH
/api/v1/users/:id/role
Changer le rôle
🔐 Admin
DELETE
/api/v1/users/:id
Supprimer un user
🔐 Admin
💰 Paiement Mobile Money
Méthode
Endpoint
Description
Auth
POST
/api/v1/paiement/initier
Initier paiement
✅
POST
/api/v1/paiement/webhook
Callback FedaPay
❌
GET
/api/v1/paiement/status/:id
Vérifier statut
✅
GET
/api/v1/paiement/history
Historique paginé
✅
GET
/api/v1/paiement/success
Redirection succès
❌
GET
/api/v1/paiement/cancel
Redirection annulation
❌
Légende : ✅ = Token JWT requis | 🔐 = Rôle Admin requis | ❌ = Public
💰 Offres disponibles
Offre
Prix
Contenu
Basic
15 000 FCFA
Code + Docker + Doc + 7j support
Premium
35 000 FCFA
Basic + repo GitHub privé + 1h call
Ultime
75 000 FCFA
Premium + déploiement VPS + SSL
Support inclus : réponse sous 24h ouvrées (lun-ven, 9h-17h GMT)
🎯 Exemples d'appels API (cURL)
Inscription

curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"client@exemple.com","password":"Password123"}'

  Connexion

  curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@exemple.com","password":"Password123"}'

  Initier un paiement Mobile Money

  curl -X POST http://localhost:3000/api/v1/paiement/initier \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"phone":"07000000","description":"Achat produit"}'

  Historique des transactions

  curl -X GET "http://localhost:3000/api/v1/paiement/history?page=1&limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN"

  Liste des utilisateurs (Admin)

  curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN_ADMIN"

  📂 Structure du projet

  backend-boilerplate-v1/
├── src/
│   ├── config/          # Configuration (database, fedapay, swagger)
│   ├── controllers/     # Logique des endpoints
│   ├── middlewares/     # auth, isAdmin, validate, errorHandler
│   ├── routes/          # Définition des routes REST
│   ├── services/        # Logique métier (auth, paiement)
│   ├── utils/           # Fonctions utilitaires (jwt, AppError)
│   ├── types/           # Types TypeScript globaux
│   └── validations/     # Schémas Zod
├── prisma/              # Schema + migrations + seed
├── scripts/             # setup.sh, change-admin-password.ts
├── docs/                # Documentation technique
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json

🔧 Variables d'environnement (.env)

# Serveur
PORT=3000
NODE_ENV=development

# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5433/boilerplate"

# JWT
JWT_SECRET=change_this_key
JWT_REFRESH_SECRET=change_this_refresh_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Sécurité
CORS_ORIGIN=*
RATE_LIMIT_MAX=100

# FedaPay (Mobile Money)
FEDAPAY_API_KEY=pk_sandbox_xxx
FEDAPAY_WEBHOOK_SECRET=whsec_xxx
FEDAPAY_ENVIRONMENT=sandbox
FEDAPAY_SUCCESS_URL=http://localhost:3000/api/v1/paiement/success
FEDAPAY_CANCEL_URL=http://localhost:3000/api/v1/paiement/cancel

Toutes les variables sont commentées dans .env.example
🧪 Tests de validation
#
Vérification
Statut
1
npm run setup fonctionne
✅
2
Swagger accessible (/api-docs)
✅
3
Admin se connecte
✅
4
Refresh token fonctionne
✅
5
Logout invalide refresh token
✅
6
Route /users protégée par admin
✅
7
Paiement crée transaction PENDING
✅
8
Webhook vérifie signature HMAC-SHA256
✅
9
npm audit = 0 vulnérabilité
✅
10
Validation téléphone burkinabè
✅
📞 Contact support
Email : support@votredomaine.com
Délai réponse : 24h ouvrées
Inclus dans l'offre : installation, bugs, questions sur le code
📜 Licence
MIT - Utilisation libre pour projets personnels et commerciaux.
🙏 Remerciements
FedaPay - Paiement Mobile Money
Prisma - ORM moderne
Express.js - Framework web

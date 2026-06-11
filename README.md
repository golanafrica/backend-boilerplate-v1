 Fichier 1 : README.md (page de vente technique)
markdown
# 🚀 Backend Boilerplate AfriStarter v1

**API REST prête à l'emploi pour applications web et mobile**  
*Paiement Mobile Money (Orange Money, MTN Money) intégré*

---

## ✨ Pourquoi ce boilerplate ?

| Problème | Solution |
|----------|----------|
| ⏳ **Gagner des semaines de développement** | Code prêt à l'emploi, rien à réinventer |
| 🔐 **Sécurité souvent négligée** | JWT refresh, tokenVersion, Helmet, rate limiting |
| 💰 **Intégration Mobile Money complexe** | FedaPay déjà configuré avec webhook |
| 🐘 **Environnement différent entre dev/prod** | Docker Compose prêt à l'emploi |
| 📖 **Documentation absente** | Swagger, README, guide IA complet |

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
| Paiement | FedaPay SDK (Mobile Money) |
| Documentation | Swagger (OpenAPI 3.0) |
| Conteneurisation | Docker + docker-compose |

---

## ⚡ Fonctionnalités

### 🔐 Authentification
- Inscription / Connexion
- Access token (15 min) + Refresh token (7 jours)
- Logout avec invalidation (tokenVersion, sans Redis)
- Rafraîchissement automatique des tokens

### 👑 Rôles et permissions
- **User** : accès à son profil
- **Admin** : gestion des utilisateurs (liste, suppression)

### 💰 Paiement Mobile Money
- Initier paiement (Orange Money, MTN Money)
- Webhook pour confirmation automatique
- Table `Transaction` avec statuts : PENDING → SUCCESS/FAILED

### 🛡️ Sécurité
- Helmet (en-têtes HTTP sécurisés)
- CORS configurable
- Rate limiting (100 requêtes/15 min)
- Validation Zod (pas d'injection)
- Hash bcrypt pour mots de passe
- .env.example commenté

### 📚 Documentation
- Swagger UI sur `/api-docs`
- README complet avec exemples cURL
- Guide IA (Cursor/Copilot prêt)

### 🐳 Déploiement
- Docker Compose (app + PostgreSQL en une commande)
- Script `npm run setup` (installation automatique)
- Seed admin par défaut (`admin@example.com` / `Admin123`)

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

📡 API Endpoints principaux
Méthode	Endpoint	Description	Auth
POST	/api/v1/auth/register	Créer un compte	❌
POST	/api/v1/auth/login	Se connecter	❌
POST	/api/v1/auth/logout	Se déconnecter	✅
POST	/api/v1/auth/refresh	Rafraîchir token	❌
GET	/api/v1/auth/me	Profil connecté	✅
GET	/api/v1/users	Liste des users	🔐 Admin
DELETE	/api/v1/users/:id	Supprimer user	🔐 Admin
POST	/api/v1/paiement/initier	Initier paiement	✅
POST	/api/v1/paiement/webhook	Callback FedaPay	❌
GET	/api/v1/paiement/status/:id	Vérifier statut	✅
✅ = Token JWT requis | 🔐 = Rôle Admin requis

💰 Offres disponibles
Offre	Prix	Contenu
Basic	15 000 FCFA	Code + Docker + Doc + 7j support
Premium	35 000 FCFA	Basic + repo GitHub privé + 1h call
Ultime	75 000 FCFA	Premium + déploiement VPS + SSL
Support inclus : réponse sous 24h ouvrées (lun-ven, 9h-17h GMT)

🎯 Exemple d'appel API (cURL)
Inscription
bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"client@exemple.com","password":"123456"}'
Connexion
bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@exemple.com","password":"123456"}'
Initier un paiement Mobile Money
bash
curl -X POST http://localhost:3000/api/v1/paiement/initier \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"montant":1000,"telephone":"771234567"}'
📂 Structure du projet
text
backend-boilerplate-v1/
├── src/
│   ├── config/          # Configuration (app, db, fedapay, swagger)
│   ├── controllers/     # Logique des endpoints
│   ├── middlewares/     # Auth, isAdmin, validate, errorHandler
│   ├── routes/          # Définition des routes REST
│   ├── services/        # Logique métier (auth, payment)
│   ├── utils/           # Fonctions utilitaires (jwt, logger)
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
env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/boilerplate"
JWT_SECENT=change_this_key
JWT_REFRESH_SECRET=change_this_refresh_key
FEDAPAY_API_KEY=pk_sandbox_xxx
Toutes les variables sont commentées dans .env.example

🧪 Tests de validation
#	Vérification	Statut
1	npm run setup fonctionne	✅
2	Swagger accessible (/api-docs)	✅
3	Admin se connecte	✅
4	Refresh token fonctionne	✅
5	Logout invalide refresh token	✅
6	Route /users protégée par admin	✅
7	Paiement crée transaction PENDING	✅
8	Webhook SUCCESS/FAILED	✅
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

Prêt à déployer votre application en quelques heures au lieu de semaines ?
📩 Achetez sur Chariow ou contactez-nous directement.

text

---

## 📄 Fichier 2 : `CHANGELOG.md`

```markdown
# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-11

### ✅ Ajouté (Added)

#### Authentification
- Inscription utilisateur (`POST /api/v1/auth/register`)
- Connexion avec JWT (`POST /api/v1/auth/login`)
- Refresh token (`POST /api/v1/auth/refresh`)
- Déconnexion avec invalidation tokenVersion (`POST /api/v1/auth/logout`)
- Récupération profil connecté (`GET /api/v1/auth/me`)

#### Rôles et permissions
- Rôle `USER` par défaut
- Rôle `ADMIN` (seed par défaut: `admin@example.com` / `Admin123`)
- Route protégée `GET /api/v1/users` (admin seulement)
- Route protégée `DELETE /api/v1/users/:id` (admin seulement)

#### Paiement Mobile Money
- Intégration FedaPay SDK
- Initier paiement (`POST /api/v1/paiement/initier`)
- Webhook FedaPay (`POST /api/v1/paiement/webhook`)
- Vérification statut transaction (`GET /api/v1/paiement/status/:id`)
- Table `Transaction` avec statuts: PENDING, SUCCESS, FAILED

#### Base de données (Prisma)
- Modèle `User` (id, email, password, role, tokenVersion, createdAt)
- Modèle `Transaction` (id, userId, amount, phone, status, fedapayId, createdAt)
- Migration initiale
- Seed automatique (admin + user test)

#### Sécurité
- Helmet pour en-têtes HTTP sécurisés
- CORS configurable
- Rate limiting (100 requêtes/15 min par IP)
- Validation Zod pour toutes les entrées
- Hash bcrypt pour mots de passe
- .env.example commenté avec toutes les variables

#### Documentation
- Swagger UI sur `/api-docs`
- README complet avec exemples cURL
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/IA_CONTEXT.md` - Contexte pour IA (Cursor/Copilot)
- `docs/TROUBLESHOOTING.md` - Résolution problèmes courants

#### Infrastructure
- Docker Compose (PostgreSQL + App)
- Dockerfile multi-stage (node:18-alpine)
- Script `npm run setup` (installation automatique)
- Script `npm run change-admin-password` (sécurité production)

#### Middlewares
- `auth.ts` - Vérification token JWT
- `isAdmin.ts` - Vérification rôle ADMIN
- `validate.ts` - Validation Zod automatique
- `errorHandler.ts` - Gestion d'erreurs centralisée

#### Utilitaires
- `jwt.ts` - Génération/vérification tokens
- `logger.ts` - Logs avec Winston

---

### 🔧 Corrigé (Fixed)
- Rien à signaler (première version)

---

### 🗑️ Déprécié (Deprecated)
- Rien à signaler (première version)

---

### ⚠️ Sécurité
- Avertissement dans README sur changement credentials admin par défaut
- Script `change-admin-password.ts` pour sécuriser avant production

---

## [1.1.0] - À venir (prévu)

### Fonctionnalités planifiées
- [ ] Envoi email de bienvenue (Nodemailer)
- [ ] Pagination sur `GET /api/v1/users`
- [ ] Tests unitaires avec Jest
- [ ] Redis pour cache (optionnel)
- [ ] Deuxième agrégateur Mobile Money (Hub2 ou PayTech)

---

## [2.0.0] - Fullstack (prévu)

### Frontend
- [ ] Next.js 14+ (App Router)
- [ ] Tailwind CSS + Shadcn/ui
- [ ] Authentification intégrée
- [ ] Dashboard admin

### Backend (nouveautés)
- [ ] Upload fichiers (Cloudinary)
- [ ] WebSockets (notifications temps réel)
- [ ] Export CSV (rapports transactions)
- [ ] API rate limit par utilisateur

---

## 📝 Guide des versions

| Version | Statut | Support |
|---------|--------|---------|
| 1.0.x | ✅ Actif | Bug fixes + sécurité |
| 1.1.x | 🚧 En développement | Nouvelles fonctionnalités |
| 2.0.0 | 📅 Planifié | Fullstack |

---

**Maintenu par [golanafrica](https://github.com/golanafrica)**
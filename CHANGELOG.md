markdown
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
- `CHANGELOG.md` - Ce fichier

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
- `rateLimit.ts` - Limitation des requêtes

#### Utilitaires
- `jwt.ts` - Génération/vérification tokens
- `logger.ts` - Logs avec Winston
- `AppError.ts` - Classe d'erreur personnalisée
- `catchAsync.ts` - Wrapper pour éviter try/catch répétitifs

#### Configuration
- `config/app.config.ts` - Configuration Express
- `config/database.config.ts` - Connexion Prisma
- `config/fedapay.config.ts` - Initialisation FedaPay
- `config/swagger.config.ts` - Documentation API

#### Types TypeScript
- `express.d.ts` - Extension du type Request (ajout de `req.user`)
- `jwt.types.ts` - Types pour payload JWT

#### Scripts npm
- `npm run dev` - Lancement mode développement (nodemon)
- `npm run build` - Compilation TypeScript
- `npm run start` - Lancement production
- `npm run setup` - Installation complète (Docker + migrate + seed)
- `npm run seed` - Réinitialisation base avec données test
- `npm run change-admin-password` - Changement mot de passe admin
- `npm run lint` - Vérification code (ESLint)
- `npm run format` - Formatage code (Prettier)

#### Routes API complètes
- `GET /health` - Vérification santé du serveur
- `GET /api-docs` - Interface Swagger
- `GET /api/v1/auth/me` - Profil utilisateur
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/logout` - Déconnexion
- `POST /api/v1/auth/refresh` - Rafraîchissement token
- `GET /api/v1/users` - Liste utilisateurs (admin)
- `DELETE /api/v1/users/:id` - Suppression utilisateur (admin)
- `POST /api/v1/paiement/initier` - Initier paiement
- `POST /api/v1/paiement/webhook` - Callback FedaPay
- `GET /api/v1/paiement/status/:id` - Statut transaction

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
- TokenVersion implémenté (pas besoin de Redis pour invalidation)
- Variables sensibles exclues du versioning (`.env` dans `.gitignore`)

---

### 📊 Métriques v1.0.0

| Métrique | Valeur |
|----------|--------|
| Lignes de code (TypeScript) | ~2500 |
| Nombre d'endpoints | 12 |
| Temps d'installation (Docker) | < 2 minutes |
| Taille image Docker | ~200 MB |
| Mémoire requise (API + DB) | 512 MB RAM |
| Tests manuels effectués | ✅ 100% |

---

## [1.1.0] - À venir (prévu Q3 2026)

### Fonctionnalités planifiées

#### 🔜 Nouvelles fonctionnalités
- [ ] Envoi email de bienvenue (Nodemailer + templates)
- [ ] Pagination sur `GET /api/v1/users`
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

#### 📚 Documentation
- [ ] Video tutoriel déploiement (YouTube)
- [ ] Exemple d'intégration React/Next.js
- [ ] Exemple d'intégration Flutter

---

## [2.0.0] - Fullstack (prévu Q1 2027)

### 🎨 Frontend (Next.js)

#### Technologies
- Next.js 14+ (App Router)
- Tailwind CSS + Shadcn/ui
- React Query (tanstack-query)
- Zustand (état global)
- next-intl (i18n)

#### Pages
- Page d'accueil avec documentation
- Page d'inscription/connexion
- Dashboard utilisateur
- Dashboard admin
- Historique des transactions
- Profil utilisateur

### ⚙️ Backend (nouveautés)

#### Nouvelles fonctionnalités
- [ ] Upload fichiers (Cloudinary ou AWS S3)
- [ ] WebSockets (Socket.io) pour notifications temps réel
- [ ] Export CSV/PDF (rapports transactions)
- [ ] API rate limit par utilisateur (Redis)
- [ ] 2FA (authentification deux facteurs)
- [ ] OAuth (Google, GitHub)
- [ ] Queue système (BullMQ + Redis)

#### Infrastructure
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring (Prometheus + Grafana)
- [ ] APM (OpenTelemetry)
- [ ] Backup automatisé sur S3

---

## 📝 Guide des versions

| Version | Statut | Support | Dernière mise à jour |
|---------|--------|---------|---------------------|
| 1.0.x | ✅ Actif (stable) | Bug fixes + sécurité | 2026-06-11 |
| 1.1.x | 🚧 En développement | Nouvelles fonctionnalités | À venir |
| 2.0.0 | 📅 Planifié | Fullstack | Q1 2027 |

**Politique de support** :
- ✅ Les versions `1.0.x` reçoivent des correctifs de sécurité pendant 12 mois
- ✅ Les versions stables sont maintenues jusqu'à la prochaine majeure
- ❌ Aucun support pour les versions non stables (alpha, beta)

---

## 🔄 Mise à jour depuis une version antérieure

### De v1.0.0 à v1.1.0 (quand disponible)
```bash
git pull origin main
npm install
npx prisma migrate deploy
npm run build
docker-compose down
docker-compose up -d --build
De v1.x vers v2.0.0
Un guide de migration sera fourni avec la sortie de v2.0.0.

👥 Contribution aux changements
Ce projet suit le Conventional Commits :

Type	Description	Exemple
feat	Nouvelle fonctionnalité	feat: add email confirmation
fix	Correction de bug	fix: refresh token expiration
docs	Documentation	docs: update API examples
style	Formatage	style: format code with prettier
refactor	Refactorisation	refactor: extract payment service
test	Tests	test: add auth integration tests
chore	Maintenance	chore: update dependencies
🙏 Remerciements
Les changements ci-dessus ont été possibles grâce à :

La communauté open-source

FedaPay pour leur SDK Mobile Money

Prisma pour l'ORM moderne

Tous les contributeurs et acheteurs qui soutiennent ce projet

📞 Signaler un bug ou suggérer une amélioration
Issues GitHub : https://github.com/golanafrica/backend-boilerplate-v1/issues

Email support : support@votredomaine.com

Réponse garantie : 24h ouvrées

Maintenu avec ❤️ par golanafrica

Dernière mise à jour : 2026-06-11

text

---
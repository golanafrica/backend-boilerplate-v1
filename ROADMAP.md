# 🗺️ FEUILLE DE ROUTE COMPLÈTE (VERSION FINALE)

## Backend Boilerplate AfriStarter v1 – Vente sur Chariow

**Durée** : 10 jours (2-3h/jour)  
**Outils obligatoires** : Git + GitHub (privé), Docker, Node.js 18+, FedaPay sandbox  
**Démarré le** : 2026-06-11  
**Statut actuel** : J4 terminé (40% complété)

---

## 📊 Progression globale

| Jour | Thème | Statut | Progression |
|------|-------|--------|-------------|
| J0 | Préparation | ✅ Terminé | 100% |
| J1 | Initialisation | ✅ Terminé | 100% |
| J2 | Base de données | ✅ Terminé | 100% |
| J3 | Authentification | ✅ Terminé | 100% |
| J4 | Rôles + Admin | ✅ Terminé | 100% |
| J5 | Paiement FedaPay | ⬜ Non commencé | 0% |
| J6 | Documentation | ⬜ Non commencé | 0% |
| J7 | Docker + Setup | ⬜ Non commencé | 0% |
| J8 | Tests + Sécurité | ⬜ Non commencé | 0% |
| J9 | Vidéo + Vente | ⬜ Non commencé | 0% |
| J10 | Publication | ⬜ Non commencé | 0% |

**Progression totale : 5 / 10 jours (50%)**

---

## 🧰 Jour 0 – Préparation (30 minutes) ✅ TERMINÉ

| Temps | Tâche | Détail | Statut |
|-------|-------|--------|--------|
| 5 min | Créer compte FedaPay Sandbox | Récupérer clés API test | ✅ |
| 5 min | Vérifier Docker | `docker --version` et `docker-compose --version` | ✅ |
| 10 min | Créer repo GitHub | `backend-boilerplate-v1` | ✅ |
| 5 min | Cloner localement | `git clone git@github.com:golanafrica/backend-boilerplate-v1.git` | ✅ |
| 5 min | Créer .gitignore | `node_modules/`, `dist/`, `.env`, `*.zip` | ✅ |

**Fin Jour 0** → ✅ Départ propre, repo GitHub prêt.

---

## 📦 Jour 1 – Initialisation du projet + Git ✅ TERMINÉ

| Temps | Tâche | Commande | Statut |
|-------|-------|----------|--------|
| 15 min | Initialiser npm + structure | `npm init -y`, créer dossiers `src/`, `prisma/`, `scripts/` | ✅ |
| 10 min | Installer dépendances | `npm i express cors helmet morgan bcrypt jsonwebtoken zod dotenv` | ✅ |
| 10 min | Installer dépendances dev | `npm i -D typescript @types/node @types/express nodemon ts-node prisma` | ✅ |
| 10 min | Configurer TypeScript | `tsconfig.json` (target: ES2020, outDir: ./dist, rootDir: ./src) | ✅ |
| 10 min | Premier commit | `git commit -m "chore: initial project structure"` | ✅ |
| 5 min | Pousser sur GitHub | `git push origin main` | ✅ |

**Fin Jour 1** → ✅ Code sauvegardé sur GitHub, structure prête.

---

## 🗄️ Jour 2 – Base de données + Prisma ✅ TERMINÉ

| Temps | Tâche | Détail | Statut |
|-------|-------|--------|--------|
| 20 min | Écrire `prisma/schema.prisma` | Modèles User (avec tokenVersion), Transaction | ✅ |
| 10 min | Écrire `.env.example` | Toutes variables commentées | ✅ |
| 15 min | Créer `docker-compose.yml` | PostgreSQL (port 5433) | ✅ |
| 10 min | Générer migration + client | `npx prisma migrate dev --name init` | ✅ |
| 15 min | Écrire `prisma/seed.ts` | Créer admin + user test | ✅ |
| 10 min | Commit | `git commit -m "feat(J2): add prisma schema and docker-compose"` | ✅ |

### Schema Prisma final :

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  password     String
  role         Role          @default(USER)
  tokenVersion Int           @default(0)
  transactions Transaction[]
  createdAt    DateTime      @default(now())
}

model Transaction {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Int
  phone     String
  status    Status   @default(PENDING)
  fedapayId String?
  createdAt DateTime @default(now())

  @@index([fedapayId])
}

enum Role { USER ADMIN }
enum Status { PENDING SUCCESS FAILED }

⚠️ SÉCURITÉ : Changez les credentials admin AVANT tout déploiement en production.
Fin Jour 2 → ✅ PostgreSQL tourne, migration faite, seed fonctionne.
🔐 Jour 3 – Authentification JWT complète ✅ TERMINÉ
Temps
Tâche
Fichier
Statut
20 min
Utils JWT
src/utils/jwt.ts → generateAccessToken, verifyAccessToken, generateRefreshToken
✅
20 min
Middleware auth
src/middlewares/auth.ts → vérifie JWT, ajoute req.user
✅
30 min
Controller auth
src/controllers/authController.ts → register, login, logout, refresh, getMe
✅
20 min
Validation Zod
src/validations/authValidation.ts → schemas pour chaque endpoint
✅
15 min
Routes auth
src/routes/authRoutes.ts → POST /register, /login, /logout, /refresh, GET /me
✅
15 min
Tester avec PowerShell
Connexion, refresh, logout (vérifier tokenVersion)
✅
10 min
Commit
git commit -m "feat(J3): add JWT auth with refresh token"
✅
Endpoints authentification :
Méthode
Endpoint
Description
Accès
POST
/api/v1/auth/register
Inscription
Public
POST
/api/v1/auth/login
Connexion
Public
POST
/api/v1/auth/refresh
Rafraîchir token
Public
POST
/api/v1/auth/logout
Déconnexion
Privé
GET
/api/v1/auth/me
Profil utilisateur
Privé
💡 Le logout incrémente tokenVersion → tous les anciens refresh tokens deviennent invalides (sans Redis).
Fin Jour 3 → ✅ Auth fonctionnelle, tokenVersion géré au logout.
👑 Jour 4 – Rôles + Routes Admin + Sécurité ✅ TERMINÉ
Temps
Tâche
Fichier
Statut
15 min
Middleware isAdmin
src/middlewares/isAdmin.ts → vérifie role === ADMIN
✅
15 min
Middleware errorHandler
src/middlewares/errorHandler.ts → gestion centralisée
✅
15 min
Database config
src/config/database.ts → instance Prisma centralisée
✅
15 min
TypeScript types
src/types/express.d.ts → extension Request.user
✅
20 min
Service users
src/services/user.service.ts → CRUD complet
✅
20 min
Controller users
src/controllers/userController.ts → getAllUsers, getUserById, deleteUser, updateUserRole
✅
15 min
Routes admin
src/routes/userRoutes.ts → GET /users, GET /users/:id, PATCH /users/:id/role, DELETE /users/:id
✅
15 min
Tester routes admin
Tests PowerShell validés (admin + user)
✅
10 min
Commit
git commit -m "feat(J4): add admin routes and security middleware"
✅
Endpoints admin :
Méthode
Endpoint
Description
Accès
GET
/api/v1/users
Liste utilisateurs (pagination)
Admin
GET
/api/v1/users/:id
Détails utilisateur
Admin
PATCH
/api/v1/users/:id/role
Changer rôle
Admin
DELETE
/api/v1/users/:id
Supprimer utilisateur
Admin
Sécurité implémentée :
✅ Middleware auth + isAdmin sur toutes les routes admin
✅ Protection contre auto-suppression
✅ Pagination (page, limit)
✅ Gestion d'erreurs centralisée
✅ Validation des paramètres
Fin Jour 4 → ✅ Admin peut gérer les utilisateurs (CRUD complet), sécurité renforcée, tests validés.
💰 Jour 5 – Paiement Mobile Money (FedaPay SDK officiel) ⬜ À FAIRE
Temps
Tâche
Fichier
Statut
15 min
Configurer FedaPay
src/config/fedapay.ts → initialiser SDK
⬜
20 min
Service paiement
src/services/paiement.service.ts → createPayment, verifyPayment, webhook
⬜
20 min
Controller paiement
src/controllers/paiementController.ts → initier, webhook, status
⬜
15 min
Validation Zod
src/validations/paiementValidation.ts → montant, telephone, userId
⬜
15 min
Routes paiement
src/routes/paiementRoutes.ts → POST /initier, POST /webhook, GET /status/:id
⬜
15 min
Tester sandbox
Simuler paiement, vérifier webhook
⬜
10 min
Commit
git commit -m "feat(J5): add Mobile Money payment with FedaPay SDK"
⬜
Endpoints paiement prévus :
Méthode
Endpoint
Description
Accès
POST
/api/v1/paiement/initier
Initier paiement Mobile Money
Privé
POST
/api/v1/paiement/webhook
Callback FedaPay
Public
GET
/api/v1/paiement/status/:id
Statut transaction
Privé
Initialisation SDK FedaPay :

import fedapay from 'fedapay';
fedapay.configure({
  apiKey: process.env.FEDAPAY_API_KEY,
  environment: 'sandbox' // changer en 'live' en production
});


Fin Jour 5 → ⬜ Intégration FedaPay fonctionnelle avec webhook.
📄 Jour 6 – Documentation Swagger + README ⬜ À FAIRE
Temps
Tâche
Détail
Statut
30 min
Installer Swagger
npm i swagger-ui-express swagger-jsdoc
⬜
20 min
Config Swagger
src/config/swagger.ts → OpenAPI 3.0
⬜
30 min
Documenter endpoints
Commentaires JSDoc dans chaque route
⬜
30 min
Écrire README.md
Installation, commandes, variables env, exemples cURL
⬜
15 min
Écrire DEPLOY.md
Guide déploiement VPS pour offre Ultime
⬜
10 min
Commit
git commit -m "docs(J6): add Swagger, README, DEPLOY guide"
⬜
Approche swagger-jsdoc (doc dans le code) :

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 */

 Fin Jour 6 → ⬜ Documentation pro, l'acheteur comprend tout en 5 minutes.
🐳 Jour 7 – Docker final + Script setup + Test machine vierge ⬜ À FAIRE
Temps
Tâche
Détail
Statut
20 min
Finaliser Dockerfile
Multi-stage build (node:18-alpine)
⬜
15 min
Finaliser docker-compose.yml
App + DB + volumes
⬜
15 min
Écrire scripts/setup.sh
Copie .env, docker-compose up, migrate, seed
⬜
10 min
Ajouter script npm
"setup": "bash scripts/setup.sh"
⬜
30 min
⚠️ TEST SUR MACHINE VIERGE
VM ou ordinateur propre sans node_modules
⬜
15 min
Corriger les oublis
Ajuster chemins, variables manquantes
⬜
10 min
Commit
git commit -m "chore(J7): add Docker setup"
⬜
Contenu de scripts/setup.sh :

#!/bin/bash
cp .env.example .env
docker-compose up -d
sleep 5
npx prisma migrate deploy
npx prisma db seed
echo "✅ Setup terminé ! API disponible sur http://localhost:3000"

⚠️ PRIORITÉ ABSOLUE : Le test sur machine vierge est l'étape la plus importante. Un boilerplate qui ne tourne pas sur une machine propre ne se vend pas.
Fin Jour 7 → ⬜ npm run setup fonctionne parfaitement.



🧪 Jour 8 – Tests + Scripts de sécurité ⬜ À FAIRE
Temps
Tâche
Détail
Statut
20 min
Tests manuels Postman
Tous les endpoints (auth, admin, paiement)
⬜
15 min
Écrire scripts/change-admin-password.ts
readline + bcrypt + mise à jour base
⬜
10 min
Ajouter script npm
"change-admin-password": "ts-node scripts/change-admin-password.ts"
⬜
15 min
Vérifier les erreurs
404 handler, validation Zod, error middleware
⬜
10 min
Commit
git commit -m "fix(J8): add admin password change script"
⬜
Fin Jour 8 → ⬜ Produit stable, pas de crash.
📹 Jour 9 – Vidéo démo + Préparation vente ⬜ À FAIRE
Temps
Tâche
Détail
Statut
15 min
Enregistrement vidéo
Max 3 minutes
⬜
10 min
Montage simple
Couper les temps morts
⬜
15 min
Captures d'écran
Swagger, Postman, terminal
⬜
20 min
Rédiger annonce Chariow
Reprendre les points forts du README
⬜
10 min
Créer le ZIP
git archive --format=zip --output=../boilerplate-v1.0.0.zip HEAD
⬜
5 min
Commit final
git commit -m "chore: prepare v1.0.0 release"
⬜
5 min
Tag GitHub
git tag v1.0.0 && git push --tags
⬜
Structure vidéo (max 3 min) :
Temps
Contenu
0:00 – 0:20
npm run setup qui tourne
0:20 – 1:00
Swagger ouvert dans le navigateur
1:00 – 1:45
Register + Login dans Postman
1:45 – 2:30
Paiement FedaPay simulé
2:30 – 3:00
Webhook → transaction SUCCESS
Fin Jour 9 → ⬜ Prêt à vendre.
🚀 Jour 10 – Publication + Support initial ⬜ À FAIRE
Temps
Tâche
Détail
Statut
10 min
Publier sur Chariow
3 offres (Basic, Premium, Ultime)
⬜
15 min
Préparer réponses types
Questions fréquentes (Docker, PostgreSQL, FedaPay clés)
⬜
10 min
Créer email support
support@votredomaine.com
⬜
15 min
Surveiller premières 24h
Répondre aux MP rapidement
⬜
10 min
Poster sur groupes
Facebook Dev Afrique + groupes WhatsApp développeurs
⬜
Modèle de réponse type pour support :

Bonjour [acheteur],

Merci pour votre achat ! Voici les réponses à vos questions :

1. Installation : exécutez `npm run setup` à la racine du projet
2. Base de données : PostgreSQL tourne via Docker (port 5433)
3. Clés FedaPay : remplacez les clés sandbox par vos clés live dans .env

N'hésitez pas si d'autres questions.
Cordialement.

Fin Jour 10 → ⬜ En ligne, premiers acheteurs.
📁 Livrables finaux (dans le ZIP)

backend-boilerplate-v1.zip   ← généré par git archive
├── src/                     # Tout le code TypeScript
├── prisma/                  # Schema + seed
├── scripts/                 # setup.sh, change-admin-password.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
├── CHANGELOG.md
├── DEPLOY.md                # Pour offre Ultime
├── ROADMAP.md
└── package.json

⚠️ Le ZIP ne contient PAS : node_modules/, .env, .git/, dist/
✅ Checklist finale avant publication
#
Vérification
Statut
1
npm run setup fonctionne sur machine vierge
⬜
2
Swagger accessible sur http://localhost:3000/api-docs
⬜
3
Admin par défaut se connecte (admin@example.com / Admin123)
✅
4
Refresh token fonctionne
✅
5
Logout rend l'ancien refresh token invalide (tokenVersion)
✅
6
Route /users accessible uniquement par admin
✅
7
Paiement FedaPay crée transaction PENDING
⬜
8
Webhook met à jour transaction en SUCCESS
⬜
9
Script change-admin-password fonctionne
⬜
10
Vidéo démo visible (< 4 min)
⬜
Progression checklist : 4 / 10 (40%)
🎯 Résumé GitHub vs ZIP
Action
Outil
Développement quotidien
Git + GitHub privé
Sauvegarde et versioning
GitHub
Tag des versions
git tag v1.0.0
Livraison acheteur Basic
ZIP via git archive
Livraison acheteur Premium
Accès repo GitHub privé
Vitrine publique
README sur repo public (sans code)
💰 Offres Chariow
Offre
Prix
Contenu
Basic
15 000 FCFA
Code + Docker + Doc + 7j support mail
Premium
35 000 FCFA
Basic + accès repo GitHub privé + 1h call
Ultime
75 000 FCFA
Premium + déploiement automatisé sur VPS (DigitalOcean/OVH) + SSL
Support inclus (offre Basic) : 7 jours calendaires, réponse sous 24h ouvrées (lun-ven, 9h-17h GMT).
Ne couvre pas : développement de nouvelles fonctionnalités, debugging du code client.
🚀 V2 — Fullstack (35 000 FCFA)
Disponible après la sortie de la v1
Fonctionnalité
Statut
Frontend Next.js + Tailwind CSS + Shadcn/ui
⬜
Upload de fichiers (Cloudinary)
⬜
WebSockets (notifications temps réel)
⬜
Tests automatisés Jest
⬜
Deuxième agrégateur Mobile Money (Hub2 ou PayTech)
⬜
📅 Dates clés
Événement
Date prévue
Démarrage projet
2026-06-11 ✅
J4 terminé (50%)
2026-06-13 ✅
J5 terminé (FedaPay)
~2026-06-14
J6 terminé (Docs)
~2026-06-15
J7 terminé (Docker)
~2026-06-16
v1.0.0 complète
~2026-06-18
Publication Chariow
~2026-06-19
v1.1.0 (emails, tests)
Q3 2026
v2.0.0 (Fullstack)
Q1 2027
📊 Métriques actuelles (v0.5.0)
Métrique
Valeur
Lignes de code (TypeScript)
~800
Nombre d'endpoints
7
Jours complétés
5 / 10
Progression globale
50%
Tests manuels effectués
✅ J3 + J4 validés
Temps estimé restant
~10-15 heures
🔄 Historique des commits

# J1 - Initialisation
git commit -m "chore(J1): initial project structure"

# J2 - Base de données
git commit -m "feat(J2): add prisma schema and docker-compose"

# J3 - Authentification
git commit -m "feat(J3): add JWT auth with refresh token and tokenVersion"

# J4 - Routes admin
git commit -m "feat(J4): complete admin user management with CRUD operations"

# J5 - Paiement (à venir)
git commit -m "feat(J5): add Mobile Money payment with FedaPay SDK"

# J6 - Documentation (à venir)
git commit -m "docs(J6): add Swagger, README, DEPLOY guide"

# J7 - Docker (à venir)
git commit -m "chore(J7): add Docker setup and test on clean machine"

# J8 - Tests (à venir)
git commit -m "fix(J8): add admin password change script and error handling"

# J9 - Publication (à venir)
git commit -m "chore(J9): prepare v1.0.0 release"
git tag v1.0.0 && git push --tags

Dernière mise à jour : 2026-06-13
Maintenu avec ❤️ par : golanafrica


docs/DATABASE.md
markdown
# Base de données - Schéma Prisma

## 📊 Vue d'ensemble

Ce projet utilise **PostgreSQL** avec **Prisma** comme ORM.  
Deux tables principales : `User` et `Transaction`.
┌─────────────────┐ ┌─────────────────────┐
│ User │ │ Transaction │
├─────────────────┤ ├─────────────────────┤
│ id (UUID) │───┐ │ id (UUID) │
│ email (string) │ │ │ userId (FK) ────────┘
│ password (hash) │ │ │ amount (Int) │
│ role (Enum) │ │ │ phone (String) │
│ tokenVersion │ │ │ status (Enum) │
│ createdAt │ │ │ fedapayId (String?) │
└─────────────────┘ │ │ createdAt │
└─────┘

text

---

## 📦 Modèle User

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
Détail des champs
Champ	Type	Description
id	String @id @default(uuid())	Identifiant unique généré automatiquement
email	String @unique	Email de connexion (doit être unique)
password	String	Mot de passe hashé avec bcrypt
role	Role @default(USER)	Rôle : USER ou ADMIN
tokenVersion	Int @default(0)	Incrémenté au logout → invalide refresh tokens
transactions	Transaction[]	Relation vers les transactions
createdAt	DateTime @default(now())	Date de création automatique
Rôle (Enum)
prisma
enum Role {
  USER
  ADMIN
}
Valeur	Droits
USER	Accès à son profil uniquement
ADMIN	Accès à /users (liste, suppression)
💰 Modèle Transaction
prisma
model Transaction {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Int
  phone     String
  status    Status   @default(PENDING)
  fedapayId String?
  createdAt DateTime @default(now())
}
Détail des champs
Champ	Type	Description
id	String @id @default(uuid())	Identifiant unique
userId	String	Clé étrangère vers User
user	User @relation	Relation Prisma
amount	Int	Montant en FCFA (ex: 1000)
phone	String	Numéro Mobile Money (9 chiffres)
status	Status @default(PENDING)	Statut du paiement
fedapayId	String?	ID de transaction FedaPay (optionnel)
createdAt	DateTime @default(now())	Date de création
Statut (Enum)
prisma
enum Status {
  PENDING
  SUCCESS
  FAILED
}
Valeur	Signification
PENDING	En attente du paiement (initial)
SUCCESS	Paiement confirmé par webhook
FAILED	Paiement échoué
🔗 Relations
One-to-Many : User → Transaction
text
User (1) ──────< (∞) Transaction
Un User peut avoir plusieurs Transaction

Une Transaction appartient à un seul User

Clé étrangère : Transaction.userId → User.id

Comportement :

Si un User est supprimé, ses Transaction restent (pas de cascade)

Pour supprimer un user, supprimez d'abord ses transactions (si nécessaire)

🛠️ Commandes Prisma
Initialisation
bash
# Générer les fichiers de migration
npx prisma migrate dev --name init

# Appliquer les migrations en production
npx prisma migrate deploy

# Générer le client Prisma (après modification du schéma)
npx prisma generate
Visualisation
bash
# Interface graphique (http://localhost:5555)
npx prisma studio
Réinitialisation
bash
# Réinitialiser la base (supprime toutes les données)
npx prisma migrate reset

# Re-seeder
npm run seed
🌱 Seed (Données initiales)
Le fichier prisma/seed.ts crée automatiquement :

Utilisateur	Email	Mot de passe	Rôle
Admin	admin@example.com	Admin123	ADMIN
Test	user@example.com	123456	USER
⚠️ Sécurité : Changez le mot de passe admin avant production :

bash
npm run change-admin-password
Exécuter le seed manuellement
bash
npm run seed
# ou
npx prisma db seed
📝 Exemples de requêtes Prisma
Créer un utilisateur
typescript
const user = await prisma.user.create({
  data: {
    email: "client@example.com",
    password: await bcrypt.hash("123456", 10),
    role: "USER"
  }
});
Lister les utilisateurs avec leurs transactions
typescript
const users = await prisma.user.findMany({
  include: {
    transactions: true
  }
});
Créer une transaction
typescript
const transaction = await prisma.transaction.create({
  data: {
    userId: userId,
    amount: 1000,
    phone: "771234567",
    status: "PENDING"
  }
});
Mettre à jour le statut d'une transaction (webhook)
typescript
const updated = await prisma.transaction.updateMany({
  where: {
    fedapayId: fedapayTransactionId
  },
  data: {
    status: "SUCCESS"
  }
});
Incrémenter tokenVersion (logout)
typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    tokenVersion: { increment: 1 }
  }
});
🔐 TokenVersion (invalidation sans Redis)
Le champ tokenVersion permet d'invalider tous les refresh tokens d'un utilisateur sans Redis.

Fonctionnement :

Au login, on génère un refresh token contenant tokenVersion

Au logout, on incrémente tokenVersion en base

Lors d'un refresh, on compare le tokenVersion du token avec celui en base

Si différent → token invalide

typescript
// Vérification du refresh token
const payload = verifyRefreshToken(token);
const user = await prisma.user.findUnique({ where: { id: payload.id } });
if (user.tokenVersion !== payload.tokenVersion) {
  throw new Error("Token invalide");
}
🗄️ Migration manuelle
Créer une migration après modification du schéma
bash
npx prisma migrate dev --name ajout_champ_telephone
Annuler la dernière migration (dev seulement)
bash
npx prisma migrate reset
Voir l'état des migrations
bash
npx prisma migrate status
📊 Backup et restauration
Backup (via Docker)
bash
docker exec -t $(docker ps -qf "name=db") pg_dump -U postgres boilerplate > backup.sql
Restauration
bash
cat backup.sql | docker exec -i $(docker ps -qf "name=db") psql -U postgres -d boilerplate
🔗 Ressources
Documentation Prisma

Schéma Prisma (référence)

Relations Prisma

text

---

## 📄 Fichier 2 : `docs/DEVELOPMENT.md`

```markdown
# Guide de développement

## 🎯 Prérequis

| Outil | Version | Vérification |
|-------|---------|--------------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker | 20+ | `docker --version` |
| Git | 2.40+ | `git --version` |

---

## 🚀 Installation locale

### Méthode 1 : Automatique (recommandée)

```bash
# Une seule commande
npm run setup
Méthode 2 : Manuelle
bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env
cp .env.example .env

# 3. Lancer PostgreSQL via Docker
docker-compose up -d db

# 4. Appliquer les migrations
npx prisma migrate dev

# 5. Lancer le serveur (mode développement)
npm run dev
📝 Commandes disponibles
Commande	Description
npm run dev	Lancement avec hot-reload (nodemon)
npm run build	Compilation TypeScript vers dist/
npm run start	Lancement du code compilé
npm run setup	Installation complète (Docker + migrate + seed)
npm run seed	Réinitialiser la base avec données test
npm run change-admin-password	Changer mot de passe admin
npx prisma studio	Interface graphique de la base
npx prisma migrate dev	Créer une nouvelle migration
npx prisma generate	Générer le client Prisma
📁 Structure du projet détaillée
text
backend-boilerplate-v1/
├── src/                      # Code source TypeScript
│   ├── config/               # Configuration
│   │   ├── app.config.ts     # Configuration Express
│   │   ├── database.config.ts # Connexion Prisma
│   │   ├── fedapay.config.ts # Initialisation FedaPay
│   │   └── swagger.config.ts # Configuration Swagger
│   ├── controllers/          # Logique des endpoints
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   └── paymentController.ts
│   ├── middlewares/          # Middlewares Express
│   │   ├── auth.ts           # Vérification JWT
│   │   ├── isAdmin.ts        # Vérification rôle ADMIN
│   │   ├── validate.ts       # Validation Zod
│   │   ├── rateLimit.ts      # Limitation requêtes
│   │   └── errorHandler.ts   # Gestion erreurs
│   ├── routes/               # Définition des routes
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   └── paymentRoutes.ts
│   ├── services/             # Logique métier
│   │   ├── auth.service.ts
│   │   └── payment.service.ts
│   ├── utils/                # Fonctions utilitaires
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   ├── AppError.ts
│   │   └── catchAsync.ts
│   ├── types/                # Types TypeScript
│   │   ├── express.d.ts      # Extension Request
│   │   └── jwt.types.ts
│   ├── validations/          # Schémas Zod
│   │   ├── authValidation.ts
│   │   └── paymentValidation.ts
│   └── server.ts             # Point d'entrée
├── prisma/                   # Prisma ORM
│   ├── schema.prisma         # Modèles de données
│   ├── migrations/           # Migrations générées
│   └── seed.ts               # Données initiales
├── scripts/                  # Scripts utilitaires
│   ├── setup.sh
│   └── change-admin-password.ts
├── docs/                     # Documentation
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
└── tsconfig.json
🧪 Ajouter un nouvel endpoint (guide étape par étape)
Exemple : Ajouter un endpoint GET /users/:id/stats
Étape 1 : Créer la validation (optionnel)
typescript
// src/validations/userValidation.ts
import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().uuid("ID utilisateur invalide")
});
Étape 2 : Créer le service
typescript
// src/services/user.service.ts
import prisma from '../config/database.config';

export const userService = {
  async getUserStats(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: { amount: true, status: true }
    });
    
    const totalSpent = transactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalSpent, transactionCount: transactions.length };
  }
};
Étape 3 : Créer le controller
typescript
// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const stats = await userService.getUserStats(id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
Étape 4 : Ajouter la route
typescript
// src/routes/userRoutes.ts
import { Router } from 'express';
import { getUserStats } from '../controllers/userController';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/isAdmin';
import { validate } from '../middlewares/validate';
import { userIdParamSchema } from '../validations/userValidation';

const router = Router();

// Protéger la route (admin seulement)
router.get(
  '/:id/stats',
  auth,
  isAdmin,
  validate(userIdParamSchema, 'params'),
  getUserStats
);

export default router;
Étape 5 : Documenter dans Swagger
typescript
/**
 * @swagger
 * /users/{id}/stats:
 *   get:
 *     summary: Statistiques d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Statistiques retournées
 */
🎨 Conventions de code
Imports
typescript
// Tiers
import express from 'express';
import { z } from 'zod';

// Locaux
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';
Types
typescript
// Toujours typer les paramètres et retours
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // ...
};
Gestion d'erreur
typescript
// Utiliser AppError
if (!user) {
  throw new AppError('Utilisateur non trouvé', 404);
}

// Ne pas faire
if (!user) {
  res.status(404).json({ message: '...' }); // ❌
}
Logs
typescript
import logger from '../utils/logger';

logger.info('Paiement initié', { userId, amount });
logger.error('Erreur FedaPay', { error: error.message });
Validation (Zod)
typescript
// Schéma
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, '6 caractères minimum')
});

// Utilisation avec middleware validate
router.post('/login', validate(loginSchema), loginController);
🧪 Tests manuels recommandés
Avant chaque commit
bash
# 1. Vérifier que le serveur démarre
npm run dev

# 2. Tester health check
curl http://localhost:3000/health

# 3. Tester inscription
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# 4. Tester connexion
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
Avant de pusher
bash
# 1. Compilation TypeScript
npm run build

# 2. Vérifier qu'il n'y a pas d'erreurs
npm run start &  # lance en arrière-plan
curl http://localhost:3000/health
kill %1
🐛 Débogage
Problèmes courants
Problème	Solution
Cannot find module 'prisma'	npx prisma generate
Error: P1001: Can't reach database server	Vérifier que PostgreSQL tourne : docker-compose ps
Error: JWT_SECRET is not defined	Copier .env.example vers .env
Error: Cannot find module '...'	npm install
Port 3000 déjà utilisé	Changer PORT dans .env
Logs en temps réel
bash
# Logs de l'application (Docker)
docker-compose logs -f app

# Logs PostgreSQL
docker-compose logs -f db

# Logs en mode dev (terminal)
npm run dev
Prisma Studio
bash
npx prisma studio
# Ouvre http://localhost:5555
📦 Workflow Git recommandé
bash
# 1. Créer une branche pour la fonctionnalité
git checkout -b feature/nouvel-endpoint

# 2. Coder, tester, commiter
git add .
git commit -m "feat: add GET /users/:id/stats endpoint"

# 3. Pusher
git push origin feature/nouvel-endpoint

# 4. Fusionner dans main (après validation)
git checkout main
git merge feature/nouvel-endpoint
git push origin main
Convention de commits
Type	Description	Exemple
feat	Nouvelle fonctionnalité	feat: add email confirmation
fix	Correction de bug	fix: refresh token expiration
docs	Documentation	docs: update API reference
style	Formatage	style: format code with prettier
refactor	Refactorisation	refactor: extract payment service
test	Tests	test: add auth integration tests
chore	Maintenance	chore: update dependencies
🔧 Variables d'environnement (développement)
Créer un fichier .env à la racine :

env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/boilerplate"
JWT_SECRET=dev_secret_key
JWT_REFRESH_SECRET=dev_refresh_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FEDAPAY_API_KEY=pk_sandbox_xxx
FEDAPAY_WEBHOOK_SECRET=whsec_xxx
⚠️ Ne jamais committer .env (dans .gitignore)

📚 Ressources utiles
Express.js Documentation

TypeScript Handbook

Prisma Documentation

Zod Documentation

JWT.io

FedaPay API

text

---

## 📄 Fichier 3 : `docs/FAQ.md`

```markdown
# FAQ - Questions fréquentes

## 📦 Installation

### ❓ L'installation échoue avec "Docker n'est pas trouvé"

**Solution :** Installez Docker Desktop depuis [docker.com](https://docker.com)  
Vérifiez ensuite : `docker --version`

---

### ❓ `npm run setup` ne fonctionne pas sur Windows

**Solution :** Utilisez **Git Bash** ou **WSL2**. PowerShell peut avoir des problèmes avec les scripts bash.

Alternative : suivez les étapes manuelles :
```bash
cp .env.example .env
docker-compose up -d
npx prisma migrate deploy
npm run seed
npm run dev
❓ La base de données ne se connecte pas
Vérifications :

bash
# 1. PostgreSQL tourne-t-il ?
docker-compose ps

# 2. Voir les logs
docker-compose logs db

# 3. Redémarrer
docker-compose restart db
Solution : Assurez-vous que DATABASE_URL dans .env correspond à :

text
postgresql://postgres:password@localhost:5432/boilerplate
🔐 Authentification
❓ Mon token expire trop vite
Solution : Modifiez JWT_EXPIRES_IN dans .env

Valeur	Durée
15m	15 minutes
1h	1 heure
1d	1 jour
7d	7 jours
env
JWT_EXPIRES_IN=1h
❓ Le refresh token ne fonctionne plus après logout
C'est normal !
Le tokenVersion est incrémenté au logout, invalidant tous les anciens refresh tokens.

Pour retester :

bash
# Se reconnecter pour obtenir un nouveau refresh token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}'
❓ Comment changer la durée du refresh token ?
Solution : Modifiez JWT_REFRESH_EXPIRES_IN dans .env

env
JWT_REFRESH_EXPIRES_IN=30d   # 30 jours
❓ "Invalid token" alors que je viens de me connecter
Vérifications :

Avez-vous bien copié le token entier (sans guillemets) ?

Le header est-il correct ? Authorization: Bearer <token>

Le token a-t-il expiré ? (15 min par défaut)

💰 Paiement Mobile Money
❓ Comment tester FedaPay sans vrai argent ?
Solution : Utilisez l'environnement sandbox

Créez un compte sur sandbox.fedapay.com

Récupérez vos clés API sandbox

Dans .env :

env
FEDAPAY_API_KEY=pk_sandbox_xxx
Les numéros de test : 771234567, 772345678, etc.

❓ Le webhook ne reçoit rien
Solutions :

Vérifiez que votre serveur est accessible publiquement

En local, utilisez ngrok : ngrok http 3000

Configurez l'URL du webhook dans FedaPay : https://votre-ngrok.ngrok.io/api/v1/paiement/webhook

Vérifiez la signature du webhook

env
FEDAPAY_WEBHOOK_SECRET=whsec_xxx  # Doit correspondre
Consultez les logs

bash
docker-compose logs app | grep webhook
❓ Comment passer en production (live) ?
Étapes :

Remplacez sandbox par live dans src/config/fedapay.ts :

typescript
fedapay.configure({
  apiKey: process.env.FEDAPAY_API_KEY,
  environment: 'live'  // ← changer ici
});
Utilisez vos clés API live FedaPay

Vérifiez les montants minimum selon l'opérateur (Orange Money, MTN Money)

❓ Que faire si le paiement reste en status PENDING ?
Causes possibles :

L'utilisateur n'a pas finalisé le paiement

Le webhook n'a pas été reçu

Délai de confirmation (parfois 30-60 secondes)

Solution : Implémentez une vérification périodique (polling) côté frontend :

javascript
setInterval(async () => {
  const status = await checkTransaction(transactionId);
  if (status === 'SUCCESS' || status === 'FAILED') {
    // Mettre à jour l'interface
  }
}, 3000); // toutes les 3 secondes
🚀 Déploiement
❓ Comment déployer sur un VPS sans l'offre Ultime ?
Solution : Utilisez le script DEPLOY.md inclus

bash
# Sur le VPS
git clone https://github.com/golanafrica/backend-boilerplate-v1.git
cd backend-boilerplate-v1
cp .env.example .env
# Remplissez .env avec vos valeurs
docker-compose up -d
❓ SSL ne fonctionne pas (certificat Let's Encrypt)
Vérifications :

Le domaine pointe-t-il vers l'IP du VPS ?

bash
dig api.votresite.com
Les ports 80 et 443 sont-ils ouverts ?

bash
sudo ufw status
Nginx est-il installé ?

bash
sudo systemctl status nginx
Solution manuelle :

bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.votresite.com
❓ Erreur 502 Bad Gateway
Cause : Nginx ne peut pas joindre l'application Node.js

Solutions :

bash
# 1. Vérifier que l'application tourne
docker-compose ps

# 2. Redémarrer l'application
docker-compose restart app

# 3. Vérifier les logs
docker-compose logs app

# 4. Redémarrer Nginx
sudo systemctl restart nginx
🗄️ Base de données
❓ Comment réinitialiser complètement la base ?
bash
# Supprime les volumes (perte de données)
docker-compose down -v

# Relance la base
docker-compose up -d db

# Applique les migrations et seed
npx prisma migrate deploy
npm run seed
❓ Comment voir les données en base ?
bash
# Interface graphique
npx prisma studio
# Ouvre http://localhost:5555

# Ou via psql
docker exec -it $(docker ps -qf "name=db") psql -U postgres -d boilerplate
❓ Comment sauvegarder la base ?
bash
# Backup
docker exec -t $(docker ps -qf "name=db") pg_dump -U postgres boilerplate > backup.sql

# Restauration
cat backup.sql | docker exec -i $(docker ps -qf "name=db") psql -U postgres -d boilerplate
🐛 Erreurs courantes
❓ Error: P2002: Unique constraint failed
Cause : Email déjà utilisé
Solution : Utilisez un autre email

❓ Error: JWT_SECRET must be provided
Cause : Variable d'environnement manquante
Solution :

bash
cp .env.example .env
# Remplissez .env avec vos valeurs
❓ Error: Cannot find module 'prisma'
Solution :

bash
npx prisma generate
❓ Error: listen EADDRINUSE: address already in use :::3000
Cause : Le port 3000 est déjà utilisé
Solution :

bash
# Changez le port dans .env
PORT=3001

# Ou tuez le processus qui utilise le port (Linux/Mac)
lsof -i :3000
kill -9 <PID>
❓ error:0308010C:digital envelope routines::unsupported (Node.js 17+)
Cause : Compatibilité OpenSSL
Solution :

bash
# Linux/Mac
export NODE_OPTIONS=--openssl-legacy-provider

# Windows PowerShell
$env:NODE_OPTIONS="--openssl-legacy-provider"
🔧 Support
📧 Email
text
support@votredomaine.com
📱 WhatsApp
text
+XXX XX XX XX XX
⏰ Délai de réponse
text
24h ouvrées (lun-ven, 9h-17h GMT)
✅ Inclus dans le support
Problèmes d'installation

Bugs dans le code fourni

Questions sur l'utilisation des endpoints

❌ Non inclus
Développement de nouvelles fonctionnalités

Debugging du code client (frontend)

Hébergement (sauf offre Ultime)

📚 Plus de ressources
Documentation complète

Guide API (API_REFERENCE.md)

Schéma base de données (DATABASE.md)

Guide contributeur (DEVELOPMENT.md)
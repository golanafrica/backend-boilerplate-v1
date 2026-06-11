markdown
# Référence API complète

## Base URL
http://localhost:3000/api/v1

text

## Headers CORS

L'API accepte les requêtes cross-origin avec les headers suivants :

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization


## Authentification
La plupart des endpoints nécessitent un token JWT dans le header :
Authorization: Bearer <votre_token>

text

---

## 📋 Sommaire
1. [Authentification](#1-authentification)
2. [Utilisateurs (Admin)](#2-utilisateurs-admin-seulement)
3. [Paiement Mobile Money](#3-paiement-mobile-money)
4. [Codes d'erreur](#codes-derreur)
5. [Exemple complet cURL](#exemple-complet-curl)

---

## 1. Authentification

### 🔓 `POST /auth/register` – Inscription

Créer un nouveau compte utilisateur.

**Corps de la requête :**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
Champ	Type	Requis	Description
email	string	✅	Email valide
password	string	✅	Minimum 6 caractères
Réponse (201 Created) :

json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "USER"
  }
}
Erreurs :

Code	Message
400	Email déjà utilisé
400	Email invalide / Mot de passe trop court
🔓 POST /auth/login – Connexion
Obtenir les tokens JWT.

Corps de la requête :

json
{
  "email": "admin@example.com",
  "password": "Admin123"
}
Réponse (200 OK) :

json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
Token	Durée	Utilisation
accessToken	15 min	Requêtes authentifiées
refreshToken	7 jours	Obtenir un nouveau accessToken
🔒 POST /auth/logout – Déconnexion
Déconnecter l'utilisateur (invalide tous ses refresh tokens).

Headers :

text
Authorization: Bearer <accessToken>
Réponse (200 OK) :

json
{
  "success": true,
  "message": "Déconnecté avec succès"
}
💡 Note : Après déconnexion, le refresh token ne fonctionne plus (tokenVersion incrémenté).

🔓 POST /auth/refresh – Rafraîchir token
Obtenir un nouveau accessToken à partir du refreshToken.

Corps de la requête :

json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Réponse (200 OK) :

json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Erreur (401) :

json
{
  "success": false,
  "message": "Refresh token invalide ou expiré"
}
🔒 GET /auth/me – Profil connecté
Obtenir les informations de l'utilisateur authentifié.

Headers :

text
Authorization: Bearer <accessToken>
Réponse (200 OK) :

json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "USER"
  }
}
2. Utilisateurs (Admin seulement)
Ces endpoints nécessitent le rôle ADMIN.

🔐 GET /users – Liste des utilisateurs
Headers :

text
Authorization: Bearer <admin_accessToken>
Réponse (200 OK) :

json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "role": "ADMIN",
      "createdAt": "2026-01-15T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "user1@example.com",
      "role": "USER",
      "createdAt": "2026-01-16T14:30:00.000Z"
    }
  ]
}
🔐 DELETE /users/:id – Supprimer un utilisateur
Headers :

text
Authorization: Bearer <admin_accessToken>
Paramètre URL :

Nom	Type	Description
id	string (UUID)	Identifiant de l'utilisateur à supprimer
Réponse (200 OK) :

json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
Erreur (404) :

json
{
  "success": false,
  "message": "Utilisateur non trouvé"
}
3. Paiement Mobile Money
💰 POST /paiement/initier – Initier un paiement
Headers :

text
Authorization: Bearer <accessToken>
Corps de la requête :

json
{
  "montant": 1000,
  "telephone": "771234567"
}
Champ	Type	Requis	Description
montant	integer	✅	Montant en FCFA (min: 100)
telephone	string	✅	Numéro Mobile Money (9 chiffres)
Réponse (200 OK) :

json
{
  "success": true,
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440002",
    "paymentUrl": "https://sandbox.fedapay.com/pay/xxx",
    "status": "PENDING",
    "amount": 1000,
    "phone": "771234567"
  }
}
📱 L'utilisateur doit être redirigé vers paymentUrl pour finaliser le paiement.

🔓 POST /paiement/webhook – Callback FedaPay
Endpoint appelé automatiquement par FedaPay après tentative de paiement.

Corps de la requête (exemple) :

json
{
  "id": "fedapay_transaction_123",
  "status": "approved",
  "amount": 1000,
  "customer": {
    "phone": "771234567"
  }
}
Réponse (200 OK) :

json
{
  "received": true
}
⚠️ Important : Ce endpoint est public (sans auth). Il valide la signature du webhook via FEDAPAY_WEBHOOK_SECRET.

🔒 GET /paiement/status/:id – Vérifier statut
Headers :

text
Authorization: Bearer <accessToken>
Paramètre URL :

Nom	Type	Description
id	string (UUID)	Identifiant interne de la transaction
Réponse (200 OK) :

json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "amount": 1000,
    "phone": "771234567",
    "status": "SUCCESS",
    "createdAt": "2026-01-16T14:30:00.000Z"
  }
}
Statut	Signification
PENDING	En attente du paiement
SUCCESS	Paiement réussi ✅
FAILED	Paiement échoué ❌
Codes d'erreur
Code	Signification	Quand ?
200	Succès	Requête traitée
201	Créé	Ressource créée (ex: inscription)
400	Requête invalide	Validation Zod échouée
401	Non authentifié	Token manquant ou invalide
403	Non autorisé	Rôle ADMIN requis
404	Non trouvé	Ressource inexistante
429	Trop de requêtes	Rate limit dépassé (100/15min)
500	Erreur serveur	Bug ou problème interne
Format d'erreur standard :

json
{
  "success": false,
  "message": "Description de l'erreur"
}
Exemple complet avec cURL
bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

# 1. Connexion admin
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
echo "Token: $TOKEN"

# 2. Lister les utilisateurs
curl -s -X GET $BASE_URL/users \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Initier un paiement
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/paiement/initier \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"montant":1000,"telephone":"771234567"}')

echo "URL de paiement: $(echo $PAYMENT_RESPONSE | jq -r '.data.paymentUrl')"

# 4. Vérifier statut (avec l'ID retourné)
TRANSACTION_ID=$(echo $PAYMENT_RESPONSE | jq -r '.data.transactionId')
curl -s -X GET $BASE_URL/paiement/status/$TRANSACTION_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
🔗 Swagger UI
Une interface interactive est disponible sur :

text
http://localhost:3000/api-docs
Elle permet de tester tous les endpoints directement depuis le navigateur.

text

---

## 📄 Fichier 2 : `docs/DATABASE.md`

```markdown
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

### Index

| Table | Colonne | Type | Utilité |
|-------|---------|------|---------|
| Transaction | fedapayId | Index | Recherche par ID FedaPay (webhook) |
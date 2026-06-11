markdown# TROUBLESHOOTING.md — Problèmes fréquents et solutions

> Ce document recense tous les problèmes connus et leurs solutions.
> Consulte ce fichier AVANT d'envoyer un email au support.

---

## 🚀 Installation & Setup

### ❌ `npm run setup` échoue immédiatement

**Symptôme :**
```bash
bash: scripts/setup.sh: Permission denied
```

**Solution :**
```bash
chmod +x scripts/setup.sh
npm run setup
```

---

### ❌ Docker ne démarre pas

**Symptôme :**
```bash
Error: bind: address already in use 0.0.0.0:5432
```

**Cause :** Un autre service PostgreSQL tourne déjà sur le port 5432.

**Solution :**
```bash
# Trouver et arrêter le service qui utilise le port
# Sur Linux/Mac
sudo lsof -i :5432
sudo kill -9 

# Sur Windows PowerShell
netstat -ano | findstr :5432
taskkill /PID  /F

# Ou changer le port dans docker-compose.yml
ports:
  - "5433:5432"  # utiliser 5433 à la place
# Et mettre à jour DATABASE_URL dans .env
DATABASE_URL="postgresql://postgres:password@localhost:5433/boilerplate"
```

---

### ❌ `docker-compose: command not found`

**Symptôme :**
```bash
docker-compose : command not found
```

**Solution :**
```bash
# Docker Desktop inclut docker compose (sans tiret) depuis v2
docker compose up -d

# Ou installer Docker Desktop qui inclut docker-compose
# https://www.docker.com/products/docker-desktop
```

---

### ❌ Prisma migrate échoue

**Symptôme :**
```bash
Error: P1001: Can't reach database server at localhost:5432
```

**Cause :** PostgreSQL n'est pas encore démarré.

**Solution :**
```bash
# 1. Démarrer la base de données d'abord
docker-compose up -d db

# 2. Attendre 5 secondes que PostgreSQL soit prêt
# 3. Ensuite lancer la migration
npx prisma migrate dev --name init
```

---

### ❌ `npx prisma migrate dev` — drift détecté

**Symptôme :**
```bash
Drift detected: Your database schema is not in sync with your migration history
```

**Solution :**
```bash
# Réinitialiser complètement la base (perd toutes les données)
npx prisma migrate reset

# Confirmer avec 'y' puis relancer le seed
npm run seed
```

---

### ❌ Le seed échoue — email déjà existant

**Symptôme :**
```bash
Unique constraint failed on the fields: (`email`)
```

**Cause :** Le seed a déjà été exécuté.

**Solution :**
```bash
# Option 1 — Réinitialiser la base complètement
npx prisma migrate reset

# Option 2 — Supprimer uniquement les users en seed
npx prisma studio
# → Supprimer manuellement les entrées dans la table User
```

---

## 🔐 Authentification JWT

### ❌ Access token expiré immédiatement

**Symptôme :**
```json
{ "success": false, "message": "jwt expired" }
```

**Cause :** `JWT_EXPIRES_IN` mal formaté dans `.env`.

**Solution :**
```bash
# ✅ Formats valides
JWT_EXPIRES_IN=15m    # 15 minutes
JWT_EXPIRES_IN=1h     # 1 heure
JWT_EXPIRES_IN=7d     # 7 jours

# ❌ Formats invalides
JWT_EXPIRES_IN=15     # manque l'unité
JWT_EXPIRES_IN="15m"  # pas de guillemets
```

---

### ❌ Token invalide après logout

**Symptôme :**
```json
{ "success": false, "message": "Token invalide" }
```

**Cause :** C'est le comportement normal — le logout incrémente `tokenVersion`.

**Solution :** Se reconnecter pour obtenir un nouveau token.

---

### ❌ Refresh token rejeté

**Symptôme :**
```json
{ "success": false, "message": "Session expirée" }
```

**Causes possibles :**
1. `JWT_REFRESH_SECRET` différent entre le login et le refresh
2. L'utilisateur s'est déconnecté (tokenVersion incrémenté)
3. Refresh token expiré (après 7 jours)

**Solution :**
```bash
# Vérifier que JWT_REFRESH_SECRET est identique dans .env
# Se reconnecter via POST /api/v1/auth/login
```

---

### ❌ `req.user` est undefined dans le controller

**Symptôme :**
TypeError: Cannot read properties of undefined (reading 'id')

**Cause :** Le middleware `auth` n'est pas appliqué sur la route.

**Solution :**
```typescript
// ✅ Correct — auth middleware présent
router.get('/me', auth, getMe);

// ❌ Incorrect — auth middleware manquant
router.get('/me', getMe);
```

---

## 💰 Paiement FedaPay

### ❌ FedaPay — clé API invalide

**Symptôme :**
```json
{ "message": "Unauthorized - Invalid API Key" }
```

**Solution :**
```bash
# 1. Vérifier la clé dans .env
FEDAPAY_API_KEY=pk_sandbox_xxx  # sandbox pour les tests
FEDAPAY_API_KEY=pk_live_xxx     # live pour la production

# 2. Vérifier que l'environnement correspond dans src/config/fedapay.ts
fedapay.configure({
  apiKey: process.env.FEDAPAY_API_KEY,
  environment: 'sandbox'  # ← doit correspondre à la clé utilisée
});
```

---

### ❌ Webhook FedaPay ne reçoit rien en local

**Symptôme :** Transaction reste en statut PENDING indéfiniment.

**Cause :** FedaPay ne peut pas appeler `localhost` — il faut une URL publique.

**Solution — utiliser ngrok :**
```bash
# 1. Installer ngrok
# https://ngrok.com/download

# 2. Exposer le port local
ngrok http 3000

# 3. Copier l'URL générée (ex: https://abc123.ngrok.io)
# 4. Dans le dashboard FedaPay sandbox, configurer le webhook :
#    https://abc123.ngrok.io/api/v1/paiement/webhook

# 5. Mettre à jour .env
FEDAPAY_SUCCESS_URL=https://abc123.ngrok.io/api/v1/paiement/success
FEDAPAY_CANCEL_URL=https://abc123.ngrok.io/api/v1/paiement/cancel
```

---

### ❌ Webhook — signature invalide

**Symptôme :**
```json
{ "success": false, "message": "Signature webhook invalide" }
```

**Solution :**
```bash
# Vérifier FEDAPAY_WEBHOOK_SECRET dans .env
# Le secret se trouve dans le dashboard FedaPay → Webhooks → Secret

# Important : le body du webhook ne doit PAS être parsé avant vérification
# Dans server.ts, ajouter AVANT express.json() :
app.use(
  '/api/v1/paiement/webhook',
  express.raw({ type: 'application/json' })
);
```

---

### ❌ Transaction reste en PENDING après paiement

**Causes possibles :**
1. Webhook non configuré dans le dashboard FedaPay
2. URL webhook non accessible publiquement (localhost)
3. Signature webhook incorrecte → webhook rejeté

**Solution :**
```bash
# 1. Vérifier les logs du webhook dans le dashboard FedaPay
# 2. Vérifier que ngrok est actif (en développement)
# 3. Tester manuellement le webhook avec Postman :
#    POST http://localhost:3000/api/v1/paiement/webhook
#    Body: payload FedaPay simulé
```

---

## 🐳 Docker

### ❌ Build Docker échoue — COPY failed

**Symptôme :**
```bash
COPY failed: file not found in build context
```

**Cause :** Le fichier `.dockerignore` exclut des fichiers nécessaires.

**Solution :**
```bash
# Vérifier .dockerignore — ne pas exclure src/ ou prisma/
# .dockerignore correct :
node_modules
dist
.env
*.zip
.git
```

---

### ❌ App Docker ne connecte pas à PostgreSQL

**Symptôme :**
```bash
Error: P1001: Can't reach database server at localhost:5432
```

**Cause :** Dans Docker, `localhost` ne pointe pas vers le service `db`.

**Solution :**
```bash
# Dans .env, utiliser le nom du service Docker (pas localhost)
DATABASE_URL="postgresql://postgres:password@db:5432/boilerplate"
#                                                ^^
#                                         nom du service docker-compose
```

---

### ❌ Migrations ne s'exécutent pas au démarrage

**Symptôme :** L'app démarre mais les tables n'existent pas.

**Solution :**
```yaml
# Dans docker-compose.yml, vérifier la commande app :
command: sh -c "npx prisma migrate deploy && npm run seed && npm run dev"
```

---

## 🔧 TypeScript & Code

### ❌ Erreur TypeScript — `req.user` implicitement `any`

**Symptôme :**
Property 'user' does not exist on type 'Request'

**Solution :**
```typescript
// Vérifier que src/types/express.d.ts existe et contient :
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        tokenVersion: number;
      };
    }
  }
}

// Et que tsconfig.json inclut ce dossier :
"include": ["src/**/*"]
```

---

### ❌ `nodemon` ne détecte pas les changements

**Symptôme :** Les modifications du code ne rechargent pas le serveur.

**Solution :**
```bash
# Vérifier le script dans package.json
"dev": "nodemon --watch src --ext ts --exec ts-node src/server.ts"

# Sur Windows, utiliser cross-env si nécessaire
npm i -D cross-env
"dev": "cross-env nodemon --watch src --ext ts --exec ts-node src/server.ts"
```

---

### ❌ `ts-node` — erreur SyntaxError ESM

**Symptôme :**
```bash
SyntaxError: Cannot use import statement in a module
```

**Solution :**
```json
// Dans tsconfig.json, vérifier :
{
  "compilerOptions": {
    "module": "commonjs",  // ← pas ESNext
    "target": "ES2020"
  }
}
```

---

## 🌐 CORS

### ❌ Erreur CORS depuis le frontend

**Symptôme :**
Access to XMLHttpRequest blocked by CORS policy

**Solution :**
```typescript
// Dans src/config/app.ts, ajouter l'origine du frontend
const corsOptions = {
  origin: [
    'http://localhost:3001',       // frontend local
    'https://monapp.vercel.app',   // frontend production
  ],
  credentials: true,
};
app.use(cors(corsOptions));
```

---

## 🛡️ Sécurité production

### ❌ Admin par défaut en production

**Symptôme :** Compte `admin@example.com / Admin123` accessible en production.

**Solution :**
```bash
# Changer immédiatement le mot de passe admin
npm run change-admin-password

# Ou via Prisma Studio
npx prisma studio
```

---

### ❌ Clés JWT faibles

**Symptôme :** Sécurité compromise.

**Solution :**
```bash
# Générer des clés fortes (32+ caractères aléatoires)
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Mettre à jour .env
JWT_SECRET=<clé générée>
JWT_REFRESH_SECRET=<autre clé générée>
```

---

## 📞 Support

Si ton problème n'est pas listé ici :

1. Vérifier les **logs Docker** : `docker-compose logs app`
2. Vérifier les **logs Winston** dans le terminal
3. Consulter **Prisma Studio** : `npx prisma studio`
4. Contacter le support : `support@votredomaine.com`
   - Réponse sous **24h ouvrées**
   - Inclure : message d'erreur complet + système d'exploitation + version Node.js
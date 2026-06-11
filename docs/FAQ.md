markdown
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
❓ Erreur "Cannot find module 'prisma'"
Solution :

bash
npx prisma generate
npm install
🔐 Authentification
❓ Mon token expire trop vite
Solution : Modifiez JWT_EXPIRES_IN dans .env

Valeur	Durée
15m	15 minutes (défaut)
1h	1 heure
1d	1 jour
7d	7 jours
env
JWT_EXPIRES_IN=1h
❓ Le refresh token ne fonctionne plus après logout
C'est normal !
Le tokenVersion est incrémenté au logout, invalidant tous les anciens refresh tokens. C'est une mesure de sécurité.

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

Exemple correct :

bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
❓ Comment créer un nouveau compte admin ?
Solution : Modifiez le fichier prisma/seed.ts et ajoutez :

typescript
await prisma.user.create({
  data: {
    email: "nouveladmin@exemple.com",
    password: await bcrypt.hash("MotDePasseSecurise", 10),
    role: "ADMIN"
  }
});
Puis exécutez :

bash
npm run seed
💰 Paiement Mobile Money
❓ Comment tester FedaPay sans vrai argent ?
Solution : Utilisez l'environnement sandbox

Créez un compte sur sandbox.fedapay.com

Récupérez vos clés API sandbox

Dans .env :

env
FEDAPAY_API_KEY=pk_sandbox_xxx
Les numéros de test : 771234567, 772345678, 773456789

❓ Le webhook ne reçoit rien
Solutions :

Vérifiez que votre serveur est accessible publiquement

En local, utilisez ngrok : ngrok http 3000

Configurez l'URL du webhook dans FedaPay : https://votre-ngrok.ngrok.io/api/v1/paiement/webhook

Vérifiez la signature du webhook

env
FEDAPAY_WEBHOOK_SECRET=whsec_xxx  # Doit correspondre à FedaPay
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

Vérifiez les montants minimum selon l'opérateur (Orange Money: 100 FCFA, MTN Money: 50 FCFA)

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
    clearInterval();
  }
}, 3000); // toutes les 3 secondes
❓ Montant minimum pour les paiements ?
Opérateur	Montant minimum
Orange Money	100 FCFA
MTN Money	50 FCFA
Wave	100 FCFA
🚀 Déploiement
❓ Comment déployer sur un VPS sans l'offre Ultime ?
Solution : Utilisez le guide DEPLOY.md inclus

bash
# Sur le VPS (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git -y

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
sudo apt install certbot python3-certbot-nginx -y
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
❓ Comment mettre à jour le code en production ?
bash
cd /chemin/du/projet
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose exec app npx prisma migrate deploy
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
⚠️ Attention : Cette opération supprime TOUTES les données.

❓ Comment voir les données en base ?
bash
# Interface graphique (recommandé)
npx prisma studio
# Ouvre http://localhost:5555

# Ou via psql (terminal)
docker exec -it $(docker ps -qf "name=db") psql -U postgres -d boilerplate
❓ Comment sauvegarder la base ?
bash
# Backup
docker exec -t $(docker ps -qf "name=db") pg_dump -U postgres boilerplate > backup.sql

# Restauration
cat backup.sql | docker exec -i $(docker ps -qf "name=db") psql -U postgres -d boilerplate
❓ Comment ajouter une nouvelle table ?
Modifiez prisma/schema.prisma

Générez la migration :

bash
npx prisma migrate dev --name ajout_table_xxx
Mettez à jour le client Prisma :

bash
npx prisma generate
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
❓ Error: listen EADDRINUSE: address already in use :::3000
Cause : Le port 3000 est déjà utilisé
Solution :

bash
# Changez le port dans .env
PORT=3001

# Ou tuez le processus qui utilise le port (Linux/Mac)
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
❓ error:0308010C:digital envelope routines::unsupported (Node.js 17+)
Cause : Compatibilité OpenSSL avec Node.js 17+
Solution :

bash
# Linux/Mac
export NODE_OPTIONS=--openssl-legacy-provider

# Windows PowerShell
$env:NODE_OPTIONS="--openssl-legacy-provider"

# Windows CMD
set NODE_OPTIONS=--openssl-legacy-provider
❓ Error: P1001: Can't reach database server
Cause : PostgreSQL ne tourne pas
Solution :

bash
# Démarrer PostgreSQL
docker-compose up -d db

# Vérifier
docker-compose ps
❓ TypeScript erreur : "Cannot find module 'express'"
Solution :

bash
npm install
npm install -D @types/express
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
✅ Inclus dans le support (offre Basic)
Problèmes d'installation

Bugs dans le code fourni

Questions sur l'utilisation des endpoints

Problèmes avec Docker

❌ Non inclus
Développement de nouvelles fonctionnalités

Debugging du code client (frontend)

Hébergement (sauf offre Ultime)

Formation personnalisée

📚 Plus de ressources
Documentation complète

Guide API (API_REFERENCE.md)

Schéma base de données (DATABASE.md)

Guide contributeur (DEVELOPMENT.md)

Architecture technique (ARCHITECTURE.md)

Guide IA (IA_CONTEXT.md)

💡 Suggestions d'amélioration
Vous avez une suggestion ou une question qui n'est pas dans cette FAQ ?

Contactez-nous à support@votredomaine.com avec pour objet FAQ - Suggestion. Nous mettrons à jour ce document régulièrement.

Dernière mise à jour : 2026-06-11
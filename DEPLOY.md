markdown
# 🚀 Guide de déploiement - Offre Ultime

Ce guide est destiné aux acheteurs de l'offre **Ultime** (75 000 FCFA).  
Il couvre le déploiement automatique sur un VPS (DigitalOcean, OVH, ou tout autre fournisseur).

---

## 📦 Ce que comprend l'offre Ultime

✅ Boilerplate complet (code + doc)  
✅ Accès repo GitHub privé  
✅ 1h d'appel explicatif  
✅ **Déploiement automatisé sur VPS** (votre serveur ou le nôtre)  
✅ **Certificat SSL Let's Encrypt**  
✅ **Configuration Nginx reverse proxy**  
✅ **Script de déploiement prêt à l'emploi**

---

## 🖥️ Prérequis (à fournir par le client)

Avant le déploiement, vous devez disposer de :

| Élément | Détail |
|---------|--------|
| **VPS** | DigitalOcean, OVH, Scaleway, ou autre (Debian/Ubuntu) |
| **Accès SSH** | Utilisateur root ou sudo |
| **Domaine** | (Recommandé) ex: api.votresite.com |
| **Clés FedaPay** | Compte [FedaPay](https://fedapay.com) avec clés live |

> 💡 **Pas de VPS ?** Nous pouvons vous en créer un (frais supplémentaires selon le forfait).

---

## 🤖 Script de déploiement automatique

### Étape 1 : Se connecter au VPS

```bash
ssh root@votre-ip-vps
Étape 2 : Lancer le script (fourni dans l'offre)
bash
# Télécharger le script
curl -O https://raw.githubusercontent.com/golanafrica/backend-boilerplate-v1/main/scripts/deploy.sh

# Rendre exécutable
chmod +x deploy.sh

# Exécuter (répondre aux questions)
./deploy.sh
Étape 3 : Répondre aux questions interactives
Le script vous demandera :

text
📝 Configuration du déploiement
--------------------------------
Domaine (ex: api.monsite.com) : api.exemple.com
Email pour SSL (Let's Encrypt) : admin@exemple.com
JWT_SECRET (appuyez Entrée pour générer auto) : [laissez vide]
FEDAPAY_API_KEY (sandbox ou live) : pk_live_xxxxx
📋 Ce que fait le script automatiquement
Étape	Action
1	Met à jour le système (apt update && upgrade)
2	Installe Docker, Docker Compose, Git, Nginx
3	Clone le dépôt GitHub privé (via token)
4	Crée le fichier .env avec vos clés
5	Lance docker-compose up -d (PostgreSQL + App)
6	Exécute prisma migrate deploy
7	Configure Nginx reverse proxy
8	Installe certificat SSL Let's Encrypt
9	Configure le firewall (UFW) : ports 22, 80, 443
10	Teste l'API (curl https://api.exemple.com/health)
🔧 Structure après déploiement
text
/home/afristarter/
├── backend-boilerplate-v1/   # Code source
├── .env                       # Variables d'environnement
├── docker-compose.yml
└── logs/                      # Logs Nginx et application

# Services systemd
- afristarter.service          # Redémarrage auto de l'API
- nginx.service                # Reverse proxy

# URLs accessibles
- https://api.exemple.com          # API
- https://api.exemple.com/api-docs # Swagger
🧪 Vérification post-déploiement
bash
# Tester l'API
curl https://api.exemple.com/health

# Devrait retourner :
{"status":"OK","message":"Backend boilerplate v1"}

# Tester Swagger
# Ouvrir https://api.exemple.com/api-docs dans le navigateur
🔄 Mises à jour (après déploiement)
Pour mettre à jour le code après un changement :

bash
cd /home/afristarter/backend-boilerplate-v1
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose exec app npx prisma migrate deploy
💡 Nous pouvons automatiser les mises à jour avec GitHub Actions (optionnel)

📊 Surveillance et logs
bash
# Voir les logs de l'application
docker-compose logs -f app

# Voir les logs PostgreSQL
docker-compose logs -f db

# Voir les logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Statut des services
systemctl status afristarter
🔐 Sauvegarde automatique
Ajoutée automatiquement par le script :

bash
# Sauvegarde quotidienne de PostgreSQL
0 2 * * * docker exec afristarter_db pg_dump -U postgres boilerplate > /backups/db_$(date +\%Y\%m\%d).sql

# Nettoyage des backups vieux de 7 jours
0 3 * * * find /backups -name "*.sql" -mtime +7 -delete
⚠️ Dépannage rapide
Problème	Solution
L'API ne répond pas	docker-compose ps (vérifier que les containers tournent)
Erreur 502 Bad Gateway	systemctl restart nginx
Base de données inaccessible	docker-compose restart db
SSL expiré	certbot renew --dry-run
Port 80/443 bloqué	ufw allow 80 && ufw allow 443
📞 Support après déploiement
Inclus	Non inclus
✅ Corrections de bugs	❌ Modification du code métier
✅ Aide à l'utilisation	❌ Développement nouvelles features
✅ Redéploiement si crash	❌ Hébergement continu (VPS à votre charge)
Contact support : support@votredomaine.com (délai 24h ouvrées)

💰 Tarifs supplémentaires (hors offre Ultime)
Service	Prix
Maintenance mensuelle (mises à jour sécurité)	25 000 FCFA/mois
Sauvegarde externalisée (S3)	10 000 FCFA/mois
Monitoring 24/7 (Uptime Robot pro)	5 000 FCFA/mois
🎯 Prochaines étapes après déploiement
Testez tous les endpoints via Swagger ou Postman

Configurez votre frontend pour pointer vers https://api.exemple.com

Passez FedaPay en mode LIVE (remplacer sandbox par live)

Changez le mot de passe admin : npm run change-admin-password

✅ Prêt à déployer ? Contactez-nous pour planifier l'appel et le déploiement.

📩 Email : support@votredomaine.com
📱 WhatsApp : +XXX XX XX XX XX (selon votre pays)
Voici le contenu complet prêt à copier-coller dans docs/ARCHITECTURE.md :
markdown# ARCHITECTURE.md — Architecture technique du projet

> Ce document décrit l'architecture complète du Backend Boilerplate AfriStarter.
> Il est destiné aux développeurs qui veulent comprendre, modifier ou étendre le projet.

---

## 🗺️ Vue d'ensemble
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend / Postman)                  │
└─────────────────────────────┬───────────────────────────────────┘
│ HTTP / HTTPS
▼
┌─────────────────────────────────────────────────────────────────┐
│                        EXPRESS.JS SERVER                         │
│                                                                  │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Helmet   │→ │   CORS    │→ │ RateLimit  │→ │BodyParser  │  │
│  │(sécurité) │  │(origines) │  │(100/15min) │  │(JSON)      │  │
│  └───────────┘  └───────────┘  └────────────┘  └────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ROUTER /api/v1                          │ │
│  │                                                            │ │
│  │  /auth/*     →  auth()  →  validate()  →  authController  │ │
│  │  /users/*    →  auth()  →  isAdmin()   →  userController  │ │
│  │  /paiement/* →  auth()  →  validate()  →  payController   │ │
│  │  /health     →                         →  { status: ok }  │ │
│  │  /api-docs   →                         →  Swagger UI      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐ │
│  │                       SERVICES                             │ │
│  │         auth.service.ts    payment.service.ts              │ │
│  └───────────┬───────────────────────────┬────────────────────┘ │
│              │                           │                       │
└──────────────┼───────────────────────────┼───────────────────────┘
│                           │
┌───────▼──────┐           ┌────────▼────────┐
│    PRISMA    │           │   FEDAPAY SDK   │
│     ORM      │           │ (Mobile Money)  │
└───────┬──────┘           └─────────────────┘
│
┌───────▼──────┐
│  PostgreSQL  │
│  (Docker)    │
└──────────────┘

> Référence de vérité : `src/server.ts` pour l'ordre réel des middlewares.

---

## 🔄 Flux d'une requête typique

Requête HTTP arrive
↓
Middlewares globaux
→ Helmet (sécurité headers)
→ CORS (vérification origine)
→ RateLimit (max 100 req/15min par IP)
→ BodyParser (parse JSON)
↓
Router /api/v1
→ Trouve la route correspondante
↓
Middlewares spécifiques à la route
→ auth()     : vérifie JWT + tokenVersion
→ isAdmin()  : vérifie role === ADMIN (si besoin)
→ validate() : vérifie le body avec Zod
↓
Controller
→ Extrait les données de req.body / req.params
→ Appelle le service correspondant
↓
Service
→ Contient la logique métier
→ Appelle Prisma ou FedaPay SDK
→ Lance AppError si problème
↓
Prisma → PostgreSQL
→ Lecture / écriture en base
↓
Retour au Controller
→ res.json({ success: true, data: ... })
↓
Si erreur à n'importe quelle étape
→ next(error) → errorHandler global
→ Retourne { success: false, message: ... }


---

## 🔐 Architecture authentification JWT
┌─────────────────────────────────────────────────────────────┐
│                        LOGIN                                 │
│                                                              │
│  POST /api/v1/auth/login                                     │
│         ↓                                                    │
│  Vérifier email + password (bcrypt.compare)                  │
│         ↓                                                    │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │   ACCESS TOKEN      │  │      REFRESH TOKEN           │  │
│  │   durée : 15 min    │  │      durée : 7 jours         │  │
│  │   contient :        │  │      contient :              │  │
│  │   - id              │  │      - id                    │  │
│  │   - email           │  │      - tokenVersion          │  │
│  │   - role            │  │                              │  │
│  │   - tokenVersion    │  │                              │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  REQUÊTE PROTÉGÉE                            │
│                                                              │
│  Authorization: Bearer <accessToken>                         │
│         ↓                                                    │
│  jwt.verify(token, JWT_SECRET)                               │
│         ↓                                                    │
│  prisma.user.findUnique({ id: decoded.id })                  │
│         ↓                                                    │
│  user.tokenVersion === decoded.tokenVersion ?                │
│         ↓ OUI              ↓ NON                            │
│    req.user = user     401 Token invalide                    │
│    next()                                                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                       LOGOUT                                 │
│                                                              │
│  user.tokenVersion++ (Prisma update)                         │
│         ↓                                                    │
│  Tous les refresh tokens existants → INVALIDES               │
│  (sans Redis, sans liste noire)                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  REFRESH TOKEN                               │
│                                                              │
│  POST /api/v1/auth/refresh                                   │
│  Body: { refreshToken }                                      │
│         ↓                                                    │
│  jwt.verify(refreshToken, JWT_REFRESH_SECRET)                │
│         ↓                                                    │
│  Vérifier tokenVersion en base                               │
│         ↓                                                    │
│  Générer nouveau ACCESS TOKEN uniquement                     │
└─────────────────────────────────────────────────────────────┘

---

## 💰 Architecture paiement Mobile Money
┌──────────────────────────────────────────────────────────────┐
│                  FLUX PAIEMENT COMPLET                        │
│                                                              │
│  1. CLIENT                                                   │
│     POST /api/v1/paiement/initier                            │
│     { montant: 1000, telephone: "97000000" }                 │
│            ↓                                                 │
│  2. BACKEND                                                  │
│     → Créer Transaction en base (status: PENDING)           │
│     → Appeler FedaPay SDK                                    │
│     → Recevoir payment_url                                   │
│     → Retourner { transactionId, payment_url }               │
│            ↓                                                 │
│  3. CLIENT                                                   │
│     → Rediriger vers payment_url (interface FedaPay)         │
│     → Client entre son numéro Mobile Money                   │
│     → Client confirme le paiement                            │
│            ↓                                                 │
│  4. FEDAPAY → WEBHOOK                                        │
│     POST /api/v1/paiement/webhook                            │
│     → Vérifier signature (FEDAPAY_WEBHOOK_SECRET)            │
│     → Mettre à jour Transaction → SUCCESS ou FAILED          │
│     → Retourner HTTP 200 (sinon FedaPay retry 3 fois)        │
│            ↓                                                 │
│  5. CLIENT (optionnel)                                       │
│     GET /api/v1/paiement/status/:transactionId               │
│     → Vérifier statut final                                  │
└──────────────────────────────────────────────────────────────┘

---

## 🗄️ Architecture base de données
┌─────────────────────────────────────────────────────────┐
│                    User                                  │
├─────────────────────────────────────────────────────────┤
│ id           String   @id @default(uuid())               │
│ email        String   @unique                            │
│ password     String   (bcrypt hash)                      │
│ role         Role     USER | ADMIN                       │
│ tokenVersion Int      @default(0)                        │
│ createdAt    DateTime @default(now())                    │
│ updatedAt    DateTime @updatedAt                         │
└───────────────────────────┬─────────────────────────────┘
│ 1
│ (un user a plusieurs transactions)
│ N
┌───────────────────────────▼─────────────────────────────┐
│                  Transaction                             │
├─────────────────────────────────────────────────────────┤
│ id        String   @id @default(uuid())                  │
│ userId    String   (clé étrangère → User.id)             │
│ amount    Int      (montant en FCFA)                     │
│ phone     String   (numéro Mobile Money)                 │
│ status    Status   PENDING | SUCCESS | FAILED            │
│ fedapayId String?  (ID retourné par FedaPay)             │
│ createdAt DateTime @default(now())                       │
│ updatedAt DateTime @updatedAt                            │
└─────────────────────────────────────────────────────────┘

---

## 🐳 Architecture Docker
docker-compose up --build
↓
┌────────────────────────────────────────────────┐
│              docker-compose.yml                 │
│                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    │
│  │   SERVICE: db   │    │  SERVICE: app   │    │
│  │                 │    │                 │    │
│  │  postgres:15    │    │  node:18-alpine │    │
│  │  port: 5432     │◄───│  port: 3000     │    │
│  │  volume:        │    │  depends_on: db │    │
│  │  postgres_data  │    │                 │    │
│  └─────────────────┘    │  Au démarrage : │    │
│                         │  1. migrate     │    │
│                         │  2. seed        │    │
│                         │  3. npm run dev │    │
│                         └─────────────────┘    │
└────────────────────────────────────────────────┘

**Dockerfile — Multi-stage build :**
Stage 1 (builder) : node:18-alpine
→ Copie le code
→ npm ci
→ npm run build (TypeScript → JavaScript)
Stage 2 (production) : node:18-alpine
→ Copie uniquement dist/ et node_modules/
→ Image finale légère (pas de TypeScript, pas de sources)
→ CMD ["node", "dist/server.js"]

---

## 📁 Responsabilités des dossiers

| Dossier | Rôle | Règle |
|---|---|---|
| `src/config/` | Initialisation des services externes | Un fichier par service |
| `src/controllers/` | Recevoir req → appeler service → envoyer res | Pas de logique métier ici |
| `src/middlewares/` | Intercepter les requêtes | Réutilisables sur plusieurs routes |
| `src/routes/` | Définir les endpoints et leurs middlewares | Pas de logique ici |
| `src/services/` | Toute la logique métier | Appelle Prisma et APIs externes |
| `src/utils/` | Fonctions utilitaires pures | Sans effets de bord |
| `src/types/` | Types TypeScript globaux | Extensions d'interfaces Express |
| `src/validations/` | Schémas Zod | Un fichier par domaine |
| `prisma/` | Schéma BDD + seed | Ne pas modifier sans migration |
| `scripts/` | Scripts d'automatisation | setup.sh, change-admin-password |
| `docs/` | Documentation technique | Maintenir à jour à chaque feature |

---

## ⚙️ Ordre des middlewares dans server.ts

L'ordre est **critique** — ne pas modifier sans raison :

```typescript
// 1. Sécurité en premier
app.use(helmet());

// 2. CORS avant tout traitement
app.use(cors(corsOptions));

// 3. Rate limiting global
app.use(rateLimiter);

// 4. Parsing du body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Logs des requêtes
app.use(morgan('combined', { stream: logger.stream }));

// 6. Routes
app.use('/api/v1', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 7. Gestion des routes inconnues
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route introuvable' }));

// 8. Error handler EN DERNIER (obligatoire)
app.use(errorHandler);
```

---

## 🔒 Décisions d'architecture importantes

### Pourquoi tokenVersion sans Redis ?
Redis ajoute une dépendance externe qui complique l'installation pour l'acheteur. Le `tokenVersion` en base PostgreSQL offre la même sécurité (invalidation immédiate au logout) sans dépendance supplémentaire. Coût : une requête Prisma par requête authentifiée.

### Pourquoi Zod plutôt que Joi ?
Zod est TypeScript-native — l'inférence de types est automatique (`z.infer<typeof schema>`). Pas besoin de définir les types séparément. C'est le standard en 2025 dans l'écosystème TypeScript.

### Pourquoi FedaPay plutôt que Stripe ?
Stripe n'accepte pas les cartes Mobile Money africaines. FedaPay est l'agrégateur de référence en Afrique francophone avec support Orange Money, MTN MoMo, Moov Money.

### Pourquoi PostgreSQL plutôt que MongoDB ?
Prisma + PostgreSQL offre un typage fort, des migrations versionnées et des relations claires. PostgreSQL est gratuit sur Neon et Supabase — parfait pour les projets africains avec budget limité.

### Pourquoi multi-stage Docker ?
L'image finale ne contient pas TypeScript ni le code source — uniquement le JavaScript compilé. Image plus légère, plus sécurisée, plus rapide à déployer.
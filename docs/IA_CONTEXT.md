# IA_CONTEXT.md — Contexte pour assistants IA

> Ce fichier est conçu pour être lu par une IA (Cursor, Copilot, Claude, etc.)
> afin qu'elle comprenne immédiatement le projet et génère du code cohérent.

---

## 🎯 Identité du projet

| Champ | Valeur |
|---|---|
| Nom | AfriStarter — Backend Boilerplate |
| Version | 1.0.0 |
| Type | API REST (backend seulement) |
| Public cible | Développeurs africains francophones |
| Valeur principale | Auth JWT + Paiement Mobile Money (FedaPay) prêts à l'emploi |
| Vendu sur | Chariow (15 000 FCFA) |

---

## 🛠️ Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Runtime | Node.js | 18+ |
| Langage | TypeScript | strict mode |
| Framework | Express.js | latest |
| ORM | Prisma | latest |
| Base de données | PostgreSQL | 15 |
| Validation | Zod | latest |
| Auth | JWT (access + refresh token) | jsonwebtoken |
| Paiement | FedaPay SDK officiel | latest |
| Documentation API | Swagger (OpenAPI 3.0) | swagger-ui-express |
| Conteneur | Docker + docker-compose | — |
| Logs | Winston | latest |

---

## 📁 Structure complète du projet

Voici le contenu complet prêt à copier-coller dans docs/IA_CONTEXT.md :
markdown# IA_CONTEXT.md — Contexte pour assistants IA

> Ce fichier est conçu pour être lu par une IA (Cursor, Copilot, Claude, etc.)
> afin qu'elle comprenne immédiatement le projet et génère du code cohérent.

---

## 🎯 Identité du projet

| Champ | Valeur |
|---|---|
| Nom | AfriStarter — Backend Boilerplate |
| Version | 1.0.0 |
| Type | API REST (backend seulement) |
| Public cible | Développeurs africains francophones |
| Valeur principale | Auth JWT + Paiement Mobile Money (FedaPay) prêts à l'emploi |
| Vendu sur | Chariow (15 000 FCFA) |

---

## 🛠️ Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Runtime | Node.js | 18+ |
| Langage | TypeScript | strict mode |
| Framework | Express.js | latest |
| ORM | Prisma | latest |
| Base de données | PostgreSQL | 15 |
| Validation | Zod | latest |
| Auth | JWT (access + refresh token) | jsonwebtoken |
| Paiement | FedaPay SDK officiel | latest |
| Documentation API | Swagger (OpenAPI 3.0) | swagger-ui-express |
| Conteneur | Docker + docker-compose | — |
| Logs | Winston | latest |

---

## 📁 Structure complète du projet
backend-boilerplate-v1/
├── src/
│   ├── config/
│   │   ├── app.ts           # Configuration Express (middlewares globaux)
│   │   ├── database.ts      # Connexion Prisma
│   │   ├── fedapay.ts       # Initialisation SDK FedaPay
│   │   └── swagger.ts       # Configuration OpenAPI 3.0
│   ├── controllers/
│   │   ├── authController.ts    # register, login, logout, refresh, getMe
│   │   ├── userController.ts    # getAllUsers, getUserById, deleteUser
│   │   └── paymentController.ts # initierPaiement, webhook, status
│   ├── middlewares/
│   │   ├── auth.ts          # Vérifie JWT, ajoute req.user
│   │   ├── isAdmin.ts       # Vérifie role === ADMIN
│   │   ├── validate.ts      # Validation automatique Zod
│   │   └── errorHandler.ts  # Gestion globale des erreurs
│   ├── routes/
│   │   ├── index.ts         # Agrège toutes les routes sous /api/v1
│   │   ├── authRoutes.ts    # /api/v1/auth/*
│   │   ├── userRoutes.ts    # /api/v1/users/*
│   │   └── paymentRoutes.ts # /api/v1/paiement/*
│   ├── services/
│   │   ├── auth.service.ts      # Logique métier auth
│   │   └── payment.service.ts   # Logique métier paiement FedaPay
│   ├── utils/
│   │   ├── jwt.ts           # generateToken, verifyToken, generateRefreshToken
│   │   ├── AppError.ts      # Classe erreur personnalisée
│   │   └── logger.ts        # Configuration Winston
│   ├── types/
│   │   ├── express.d.ts     # Extension req.user pour TypeScript
│   │   └── index.ts         # Types globaux du projet
│   ├── validations/
│   │   ├── authValidation.ts    # Schémas Zod pour auth
│   │   └── paymentValidation.ts # Schémas Zod pour paiement
│   └── server.ts            # Point d'entrée principal
├── prisma/
│   ├── schema.prisma        # Modèles User, Transaction + enums
│   └── seed.ts              # Admin par défaut + user test
├── scripts/
│   ├── setup.sh             # Installation complète en une commande
│   └── change-admin-password.ts # Sécurité production
├── docs/
│   ├── IA_CONTEXT.md        # CE FICHIER
│   ├── ARCHITECTURE.md      # Architecture technique détaillée
│   └── TROUBLESHOOTING.md   # Problèmes fréquents et solutions
├── .github/
│   └── copilot-instructions.md
├── docker-compose.yml       # PostgreSQL + App
├── Dockerfile               # Multi-stage build node:18-alpine
├── .env.example             # Toutes les variables commentées
├── .cursorrules             # Instructions pour Cursor IDE
├── tsconfig.json
├── package.json
├── README.md
├── CHANGELOG.md
├── DEPLOY.md
└── ROADMAP.md

---

## 🗄️ Schéma de base de données (Prisma)

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  password     String        // bcrypt hash
  role         Role          @default(USER)
  tokenVersion Int           @default(0) // ← incrémenter au logout
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Transaction {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Int      // en francs CFA
  phone     String   // numéro Mobile Money
  status    Status   @default(PENDING)
  fedapayId String?  // ID retourné par FedaPay
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role   { USER ADMIN }
enum Status { PENDING SUCCESS FAILED }
```

---

## 🔌 Endpoints complets

### Auth — `/api/v1/auth`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Créer un compte |
| POST | `/login` | ❌ | Connexion → access + refresh token |
| POST | `/logout` | ✅ | Déconnexion + tokenVersion++ |
| POST | `/refresh` | ❌ | Nouvel access token via refresh token |
| GET | `/me` | ✅ | Profil de l'utilisateur connecté |

### Users — `/api/v1/users`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ ADMIN | Liste tous les utilisateurs |
| GET | `/:id` | ✅ | Profil d'un utilisateur |
| DELETE | `/:id` | ✅ ADMIN | Supprimer un utilisateur |

### Paiement — `/api/v1/paiement`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/initier` | ✅ | Créer lien paiement Mobile Money |
| POST | `/webhook` | ❌ | Callback FedaPay (signature vérifiée) |
| GET | `/status/:id` | ✅ | Vérifier statut transaction |

### Utilitaires

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | Statut serveur `{ status: "ok" }` |
| GET | `/api-docs` | Swagger UI |

---

## 📐 Conventions de code

### Imports
```typescript
// ✅ Correct — ES Modules avec chemins explicites
import express, { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

// ❌ Incorrect
const express = require('express'); // pas de CommonJS require
import * as anything from '...';   // éviter les imports *
```

### Types TypeScript
```typescript
// ✅ Toujours typer explicitement
async function register(email: string, password: string): Promise<User>

// ❌ Jamais utiliser any
const data: any = req.body; // INTERDIT
```

### Extension de Request Express
```typescript
// src/types/express.d.ts
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
```

---

## 🧩 Patterns de code à reproduire

### Pattern Controller
```typescript
// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error); // toujours passer à errorHandler
  }
};
```

### Pattern Service
```typescript
// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export const authService = {
  async register(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email déjà utilisé', 400);

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed },
      select: { id: true, email: true, role: true, createdAt: true }
      // ← ne jamais retourner le password
    });
    return user;
  }
};
```

### Pattern Validation Zod
```typescript
// src/validations/authValidation.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, '6 caractères minimum'),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
  })
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
```

### Pattern Middleware Validate
```typescript
// src/middlewares/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({ body: req.body, params: req.params, query: req.query });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => e.message).join(', ');
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
```

### Pattern AppError
```typescript
// src/utils/AppError.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Pattern Error Handler Global
```typescript
// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  // Erreur inattendue — ne pas exposer les détails en prod
  logger.error(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message
  });
};
```

### Pattern Route
```typescript
// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, logout, refresh, getMe } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { registerSchema, loginSchema } from '../validations/authValidation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/logout',   auth,                     logout);
router.post('/refresh',                            refresh);
router.get('/me',        auth,                     getMe);

export default router;
```

---

## 🔐 Logique JWT et tokenVersion

```typescript
// Flux complet d'authentification

// LOGIN → génère 2 tokens
const accessToken  = jwt.sign({ id, email, role, tokenVersion }, JWT_SECRET,         { expiresIn: '15m' });
const refreshToken = jwt.sign({ id, tokenVersion },              JWT_REFRESH_SECRET,  { expiresIn: '7d' });

// MIDDLEWARE AUTH → vérifie access token + tokenVersion
const decoded = jwt.verify(token, JWT_SECRET);
const user = await prisma.user.findUnique({ where: { id: decoded.id } });
if (user.tokenVersion !== decoded.tokenVersion) throw new AppError('Token invalide', 401);

// LOGOUT → invalide TOUS les refresh tokens existants
await prisma.user.update({
  where: { id: req.user.id },
  data: { tokenVersion: { increment: 1 } }
});

// REFRESH → vérifie refresh token + tokenVersion → génère nouvel access token
const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
const user = await prisma.user.findUnique({ where: { id: decoded.id } });
if (user.tokenVersion !== decoded.tokenVersion) throw new AppError('Session expirée', 401);
// → générer nouveau accessToken uniquement
```

---

## 💰 Logique paiement FedaPay

```typescript
// Flux complet paiement Mobile Money

// ÉTAPE 1 — Initier le paiement
// POST /api/v1/paiement/initier
// Body: { montant: 1000, telephone: "97000000", userId: "uuid" }
// → Créer transaction PENDING en base
// → Appeler FedaPay SDK → obtenir payment_url
// → Retourner { transactionId, payment_url }

// ÉTAPE 2 — Client paie via payment_url (FedaPay gère l'interface)

// ÉTAPE 3 — Webhook FedaPay
// POST /api/v1/paiement/webhook
// → Vérifier signature FedaPay (FEDAPAY_WEBHOOK_SECRET)
// → Mettre à jour transaction PENDING → SUCCESS ou FAILED
// → Retourner 200 OK à FedaPay (sinon FedaPay retry)

// ÉTAPE 4 — Vérification statut
// GET /api/v1/paiement/status/:id
// → Retourner transaction avec statut actuel
```

---

## 🌍 Variables d'environnement

```bash
# SERVER
PORT=3000
NODE_ENV=development

# DATABASE
DATABASE_URL="postgresql://postgres:password@localhost:5432/boilerplate"

# JWT
JWT_SECRET=change_this_strong_secret_key
JWT_REFRESH_SECRET=change_this_other_strong_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# FEDAPAY
FEDAPAY_API_KEY=pk_sandbox_xxx
FEDAPAY_WEBHOOK_SECRET=whsec_xxx
FEDAPAY_SUCCESS_URL=http://localhost:3000/api/v1/paiement/success
FEDAPAY_CANCEL_URL=http://localhost:3000/api/v1/paiement/cancel

# ADMIN PAR DÉFAUT (seed)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123  # ← CHANGER EN PRODUCTION
```

---

## 🚨 Règles absolues (ne jamais enfreindre)
❌ Ne JAMAIS utiliser any comme type TypeScript
❌ Ne JAMAIS stocker un mot de passe en clair
❌ Ne JAMAIS exposer le champ password dans une réponse API
❌ Ne JAMAIS hardcoder une clé API ou secret dans le code
❌ Ne JAMAIS modifier schema.prisma sans en informer l'utilisateur
❌ Ne JAMAIS oublier await sur les appels Prisma
❌ Ne JAMAIS créer de nouvelles dépendances npm sans demander
❌ Ne JAMAIS utiliser console.log en production (utiliser logger)

---

## ✅ Comportement attendu de l'IA

Quand un développeur demande de générer du code pour ce projet :

1. Respecter la structure de dossiers définie ci-dessus
2. Utiliser TypeScript avec types explicites (jamais `any`)
3. Suivre le pattern **Controller → Service → Prisma**
4. Ajouter la validation Zod pour toute entrée utilisateur
5. Gérer les erreurs avec `AppError` + `next(error)`
6. Ne pas créer de dépendances non listées dans le stack
7. Toujours inclure les imports nécessaires en haut du fichier
8. Utiliser `async/await` (jamais `.then()`)
9. Ne jamais retourner le champ `password` dans les réponses
10. Ajouter les commentaires Swagger `@swagger` dans les routes

---

## 📦 Commandes utiles

| Commande | Action |
|---|---|
| `npm run dev` | Lancement mode développement |
| `npm run build` | Compilation TypeScript → dist/ |
| `npm run setup` | Installation complète (Docker + migrate + seed) |
| `npm run seed` | Réinitialiser base avec données test |
| `npm run change-admin-password` | Changer mot de passe admin (production) |
| `npx prisma studio` | Interface visuelle base de données |
| `npx prisma migrate dev` | Créer une nouvelle migration |
| `docker-compose up -d` | Démarrer PostgreSQL en arrière-plan |
| `docker-compose down` | Arrêter les conteneurs |
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import paiementRoutes from './routes/paiementRoutes';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';

// Charger les variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// =====================
// MIDDLEWARES GLOBAUX
// =====================

// Logger HTTP (morgan) - uniquement en développement
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // En production, logger au format combiné pour analyse
  app.use(morgan('combined'));
}

// 🔒 Sécurité : Helmet avec CSP configurée pour Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// 🔒 CORS - inclut le header X-FedaPay-Signature pour les webhooks
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-FedaPay-Signature']
}));

// 🔒 Parsers JSON (AVANT rate limit pour catch les erreurs de parsing)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 🔒 Rate Limiting : protection contre les attaques DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// =====================
// SWAGGER DOCUMENTATION
// =====================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AfriStarter API Documentation',
  customfavIcon: 'https://avatars.githubusercontent.com/u/136971789',
  explorer: true,
}));

// =====================
// ROUTES DE TEST
// =====================

/**
 * Health check - utilisé par Docker, load balancers, monitoring
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend boilerplate v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req: Request, res: Response) => {
  res.redirect('/health');
});

// Exposer la structure de l'API uniquement en développement
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/v1', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'AfriStarter Backend API',
      version: '1.0.0',
      description: 'Boilerplate with Express, TypeScript, JWT, FedaPay',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        paiement: '/api/v1/paiement',
        docs: '/api-docs'
      }
    });
  });
}

// =====================
// ROUTES API
// =====================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/paiement', paiementRoutes);

// =====================
// GESTION DES ERREURS
// =====================

// 404 Handler - doit être APRÈS toutes les routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`
  });
});

// 🔒 Global Error Handler - centralisé dans errorHandler.ts
// Gère : Prisma, Zod, AppError, SyntaxError, erreurs inattendues
app.use(errorHandler);

// =====================
// DÉMARRAGE DU SERVEUR
// =====================

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║  🚀 Backend Boilerplate AfriStarter v1               ║
║  📡 Serveur démarré sur http://localhost:${PORT}      ║
║  ❤️  Health check: http://localhost:${PORT}/health    ║
║  📚 API: http://localhost:${PORT}/api/v1             ║
║  📖 Swagger: http://localhost:${PORT}/api-docs       ║
║  💰 Paiement: http://localhost:${PORT}/api/v1/paiement ║
║  🔒 Mode: ${process.env.NODE_ENV || 'development'}              ║
╚══════════════════════════════════════════════════════╝
    `);
  });

  // Gestion propre de l'arrêt (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.close(() => {
      console.log('✅ Serveur arrêté proprement');
      process.exit(0);
    });
  });

  // Gestion des erreurs non catchées
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

export default app;
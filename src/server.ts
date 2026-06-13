import express, { Application, Request, Response, NextFunction } from 'express';
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

// Charger les variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// =====================
// MIDDLEWARES GLOBAUX
// =====================

// Logger HTTP (morgan)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Sécurité : Helmet
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// =====================
// SWAGGER DOCUMENTATION
// =====================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AfriStarter API Documentation',
  customfavIcon: 'https://avatars.githubusercontent.com/u/136971789',
}));

// =====================
// ROUTES DE TEST
// =====================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend boilerplate v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.redirect('/health');
});

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

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erreur:', err.stack);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Erreur interne du serveur'
  });
});

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

  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.close(() => {
      console.log('✅ Serveur arrêté proprement');
      process.exit(0);
    });
  });
}

export default app;
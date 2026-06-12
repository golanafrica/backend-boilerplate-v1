import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// =====================
// MIDDLEWARES GLOBAUX
// =====================

// Logger HTTP (morgan)
app.use(morgan('dev'));

// Sécurité : Helmet ajoute des en-têtes HTTP sécurisés
app.use(helmet());

// CORS (autoriser les requêtes cross-origin)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));

// Parser URL encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
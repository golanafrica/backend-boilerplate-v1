import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AfriStarter Backend API',
      version: '1.0.0',
      description: `
API REST prête à l'emploi pour applications web et mobile avec **paiement multi-processeur** intégré.

## Fonctionnalités principales
- 🔐 Authentification JWT (access + refresh tokens)
- 👑 Gestion des rôles (USER/ADMIN)
- 💰 **Paiement multi-processeur** (FedaPay + Stripe)
  - 🌍 **FedaPay** : Mobile Money (Orange Money, MTN Money, Moov Money) - Afrique de l'Ouest
  - 🌐 **Stripe** : Cartes bancaires (Visa, Mastercard, Apple Pay, Google Pay) - International
- 🛡️ Sécurité renforcée (0 vulnérabilité npm audit)
- 📚 Documentation interactive Swagger

## Authentification
La plupart des endpoints nécessitent un token JWT dans le header:
\`\`\`
Authorization: Bearer VOTRE_TOKEN
\`\`\`

## Paiement Multi-Processeur
Architecture extensible (Pattern Strategy) avec support de plusieurs processeurs :

### FedaPay (Mobile Money)
- **Région** : Afrique de l'Ouest (Burkina Faso, Sénégal, Bénin, Côte d'Ivoire)
- **Méthodes** : Orange Money, MTN Money, Moov Money
- **Devise** : XOF (FCFA)
- **Webhook** : Signature HMAC-SHA256 via header \`X-FedaPay-Signature\`

### Stripe (Cartes bancaires)
- **Région** : International
- **Méthodes** : Visa, Mastercard, Apple Pay, Google Pay
- **Devise** : EUR, USD, etc.
- **Webhook** : Signature via header \`Stripe-Signature\`

### Configuration
- Processeur par défaut : variable d'environnement \`PAYMENT_PROVIDER\` (fedapay ou stripe)
- Sélection par requête : champ \`provider\` dans le body de \`/initier\`
- Webhooks : paramètre \`?provider=\` dans l'URL du webhook

### Ajouter un nouveau processeur
1. Implémenter l'interface \`PaymentProvider\`
2. Ajouter le provider dans \`PaymentFactory\`
3. Configurer les variables d'environnement
      `,
      contact: {
        name: 'Support AfriStarter',
        email: 'support@votredomaine.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /api/v1/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID interne de la transaction' },
            amount: { type: 'integer', description: 'Montant (FCFA pour FedaPay, centimes pour Stripe)' },
            phone: { type: 'string', description: 'Numéro de téléphone (Mobile Money - FedaPay)' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'SUCCESS', 'FAILED'],
              description: 'Statut du paiement'
            },
            fedapayId: { 
              type: 'string', 
              nullable: true,
              description: 'ID de transaction du processeur (FedaPay ou Stripe)'
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PaymentProvider: {
          type: 'object',
          description: 'Informations sur les processeurs de paiement disponibles',
          properties: {
            current: { 
              type: 'string',
              enum: ['fedapay', 'stripe'],
              description: 'Processeur actuellement configuré'
            },
            available: { 
              type: 'array',
              items: { type: 'string', enum: ['fedapay', 'stripe'] },
              description: 'Liste de tous les processeurs disponibles'
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Endpoints d\'authentification' },
      { name: 'Users', description: 'Gestion des utilisateurs (Admin)' },
      { 
        name: 'Paiement', 
        description: 'Paiement multi-processeur (FedaPay Mobile Money + Stripe Cartes bancaires)' 
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
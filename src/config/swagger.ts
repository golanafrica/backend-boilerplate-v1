import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AfriStarter Backend API',
      version: '1.0.0',
      description: `
API REST prête à l'emploi pour applications web et mobile avec paiement Mobile Money intégré.

## Fonctionnalités principales
- 🔐 Authentification JWT (access + refresh tokens)
- 👑 Gestion des rôles (USER/ADMIN)
- 💰 Paiement Mobile Money (FedaPay REST API)
- 🛡️ Sécurité renforcée (0 vulnérabilité npm audit)
- 📚 Documentation interactive Swagger

## Authentification
La plupart des endpoints nécessitent un token JWT dans le header:
\`\`\`
Authorization: Bearer VOTRE_TOKEN
\`\`\`

## Paiement Mobile Money
Intégration FedaPay avec webhook et vérification HMAC-SHA256.
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
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'integer', description: 'Montant en FCFA' },
            phone: { type: 'string', description: 'Numéro de téléphone burkinabè' },
            status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
            fedapayId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
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
      { name: 'Paiement', description: 'Paiement Mobile Money (FedaPay)' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
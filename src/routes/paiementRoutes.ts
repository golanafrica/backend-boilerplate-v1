import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { auth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { paiementController } from '../controllers/paiementController';
import { 
  initierPaiementSchema, 
  transactionIdParamSchema 
} from '../validations/paiementValidation';

const router = Router();

/**
 * 🔒 Middleware pour capturer le raw body du webhook
 * Nécessaire pour la vérification HMAC-SHA256
 * express.raw() remplace express.json() pour cette route uniquement
 */
const captureWebhookRawBody = (req: Request, res: Response, next: NextFunction) => {
  if (Buffer.isBuffer(req.body)) {
    (req as any).rawBody = req.body.toString('utf8');
    try {
      req.body = JSON.parse((req as any).rawBody);
    } catch {
      // Si ce n'est pas du JSON valide, on garde le body tel quel
    }
  }
  next();
};

/**
 * @swagger
 * /api/v1/paiement/providers:
 *   get:
 *     summary: Lister les processeurs de paiement disponibles
 *     description: Retourne le processeur actuel et la liste de tous les processeurs supportés
 *     tags: [Paiement]
 *     responses:
 *       200:
 *         description: Liste des processeurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: string
 *                       description: Processeur actuellement configuré
 *                       example: fedapay
 *                     available:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Liste de tous les processeurs disponibles
 *                       example: [fedapay, stripe]
 */
router.get('/providers', paiementController.getProviders.bind(paiementController));

/**
 * @swagger
 * /api/v1/paiement/initier:
 *   post:
 *     summary: Initier un paiement (multi-processeur)
 *     description: |
 *       Crée un paiement via le processeur configuré (FedaPay par défaut, ou Stripe si spécifié).
 *       
 *       **Processeurs supportés :**
 *       - `fedapay` : Mobile Money (Orange Money, MTN Money, Moov Money) - Afrique de l'Ouest
 *       - `stripe` : Cartes bancaires (Visa, Mastercard, Apple Pay, Google Pay) - International
 *     tags: [Paiement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 5000000
 *                 description: Montant en FCFA (100 à 5 000 000) pour FedaPay, ou en centimes pour Stripe
 *                 example: 1000
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone burkinabè (requis pour FedaPay)
 *                 example: "07000000"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email du client (requis pour Stripe)
 *                 example: "client@example.com"
 *               description:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Description du paiement
 *                 example: "Achat produit"
 *               provider:
 *                 type: string
 *                 enum: [fedapay, stripe]
 *                 description: Processeur de paiement (optionnel, utilise PAYMENT_PROVIDER par défaut)
 *                 example: "fedapay"
 *               currency:
 *                 type: string
 *                 description: Devise (XOF pour FedaPay, EUR/USD pour Stripe)
 *                 example: "XOF"
 *     responses:
 *       201:
 *         description: Paiement initié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Paiement initié avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     paymentUrl:
 *                       type: string
 *                       nullable: true
 *                       description: URL de paiement (pour Stripe Checkout)
 *                     token:
 *                       type: string
 *                       nullable: true
 *                       description: Token de paiement (pour FedaPay)
 *                     provider:
 *                       type: string
 *                       description: Processeur utilisé
 *                       example: fedapay
 *       400:
 *         description: Données invalides ou processeur non supporté
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur du processeur de paiement
 */
router.post(
  '/initier',
  auth,
  validate(initierPaiementSchema),
  paiementController.initierPaiement.bind(paiementController)
);

/**
 * @swagger
 * /api/v1/paiement/webhook:
 *   post:
 *     summary: Webhook multi-processeur (callback automatique)
 *     description: |
 *       Endpoint appelé par les processeurs de paiement pour notifier du statut d'un paiement.
 *       
 *       **Processeurs supportés :**
 *       - FedaPay : Header `X-FedaPay-Signature` (HMAC-SHA256)
 *       - Stripe : Header `Stripe-Signature`
 *       
 *       🔒 **Sécurité** : La signature est vérifiée automatiquement selon le processeur.
 *       
 *       💡 **Note** : Utilisez le paramètre `?provider=stripe` pour spécifier le processeur si différent du défaut.
 *     tags: [Paiement]
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [fedapay, stripe]
 *         description: Processeur de paiement (optionnel, utilise PAYMENT_PROVIDER par défaut)
 *       - in: header
 *         name: X-FedaPay-Signature
 *         schema:
 *           type: string
 *         description: Signature HMAC-SHA256 du body (pour FedaPay)
 *       - in: header
 *         name: Stripe-Signature
 *         schema:
 *           type: string
 *         description: Signature du webhook (pour Stripe)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payload variable selon le processeur
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 description: ID de la transaction (FedaPay)
 *               id:
 *                 type: string
 *                 description: ID alternatif (FedaPay ou Stripe)
 *               status:
 *                 type: string
 *                 description: Statut du paiement
 *               amount:
 *                 type: string
 *                 description: Montant du paiement
 *               type:
 *                 type: string
 *                 description: Type d'événement (Stripe uniquement)
 *     responses:
 *       200:
 *         description: Webhook traité (toujours 200 pour éviter les retries)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Webhook traité
 *                 transactionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, SUCCESS, FAILED]
 *       401:
 *         description: Signature webhook invalide
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json', limit: '10kb' }),
  captureWebhookRawBody,
  paiementController.webhook.bind(paiementController)
);

/**
 * @swagger
 * /api/v1/paiement/status/{id}:
 *   get:
 *     summary: Récupérer le statut d'une transaction
 *     tags: [Paiement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la transaction
 *     responses:
 *       200:
 *         description: Statut de la transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Transaction non trouvée
 */
router.get(
  '/status/:id',
  auth,
  validate({ params: transactionIdParamSchema }),
  paiementController.getStatus.bind(paiementController)
);

/**
 * @swagger
 * /api/v1/paiement/history:
 *   get:
 *     summary: Historique paginé des transactions de l'utilisateur
 *     tags: [Paiement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Historique des transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 */
router.get(
  '/history',
  auth,
  paiementController.getHistory.bind(paiementController)
);

/**
 * @swagger
 * /api/v1/paiement/success:
 *   get:
 *     summary: Page de redirection après paiement réussi
 *     description: L'utilisateur est redirigé ici par le processeur après un paiement approuvé
 *     tags: [Paiement]
 *     parameters:
 *       - in: query
 *         name: transaction_id
 *         schema:
 *           type: string
 *         description: ID de la transaction
 *       - in: query
 *         name: session_id
 *         schema:
 *           type: string
 *         description: ID de session (Stripe)
 *     responses:
 *       200:
 *         description: Paiement réussi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Paiement réussi !
 */
router.get('/success', paiementController.success.bind(paiementController));

/**
 * @swagger
 * /api/v1/paiement/cancel:
 *   get:
 *     summary: Page de redirection après paiement annulé
 *     description: L'utilisateur est redirigé ici par le processeur après annulation
 *     tags: [Paiement]
 *     parameters:
 *       - in: query
 *         name: transaction_id
 *         schema:
 *           type: string
 *         description: ID de la transaction
 *     responses:
 *       400:
 *         description: Paiement annulé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Paiement annulé
 */
router.get('/cancel', paiementController.cancel.bind(paiementController));

export default router;
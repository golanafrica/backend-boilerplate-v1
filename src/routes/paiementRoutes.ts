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
  // Si le body est déjà un Buffer (depuis express.raw)
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
 * /api/v1/paiement/initier:
 *   post:
 *     summary: Initier un paiement Mobile Money
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
 *               - phone
 *               - description
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 5000000
 *                 description: Montant en FCFA (100 à 5 000 000)
 *                 example: 1000
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone burkinabè (07XXXXXXXX ou +22607XXXXXXXX)
 *                 example: "07000000"
 *               description:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Description du paiement
 *                 example: "Achat produit"
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
 *                     token:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur FedaPay
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
 *     summary: Webhook FedaPay (callback automatique)
 *     description: |
 *       Endpoint appelé par FedaPay pour notifier du statut d'un paiement.
 *       La signature HMAC-SHA256 est vérifiée automatiquement.
 *       
 *       🔒 **Sécurité** : Le header `X-FedaPay-Signature` doit contenir la signature HMAC-SHA256 
 *       du body, calculée avec la clé `FEDAPAY_WEBHOOK_SECRET`.
 *     tags: [Paiement]
 *     parameters:
 *       - in: header
 *         name: X-FedaPay-Signature
 *         schema:
 *           type: string
 *         description: Signature HMAC-SHA256 du body (optionnel en dev)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 description: ID de la transaction FedaPay
 *               id:
 *                 type: string
 *                 description: ID alternatif de la transaction
 *               status:
 *                 type: string
 *                 description: Statut du paiement (approved, failed, etc.)
 *               amount:
 *                 type: string
 *                 description: Montant du paiement
 *     responses:
 *       200:
 *         description: Webhook traité (toujours 200 pour éviter les retries FedaPay)
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
  // 🔒 express.raw() capture le body brut AVANT parsing JSON
  express.raw({ type: 'application/json', limit: '10kb' }),
  // 🔒 Middleware pour parser et stocker le raw body
  captureWebhookRawBody,
  // ❌ PAS de validate(webhookSchema) : FedaPay peut envoyer des champs variables
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
 *     description: L'utilisateur est redirigé ici par FedaPay après un paiement approuvé
 *     tags: [Paiement]
 *     parameters:
 *       - in: query
 *         name: transaction_id
 *         schema:
 *           type: string
 *         description: ID de la transaction FedaPay
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
 *     description: L'utilisateur est redirigé ici par FedaPay après annulation
 *     tags: [Paiement]
 *     parameters:
 *       - in: query
 *         name: transaction_id
 *         schema:
 *           type: string
 *         description: ID de la transaction FedaPay
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
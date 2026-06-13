import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { paiementController } from '../controllers/paiementController';
import { 
  initierPaiementSchema, 
  webhookSchema,
  transactionIdParamSchema 
} from '../validations/paiementValidation';

const router = Router();

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
 *     tags: [Paiement]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction_id:
 *                 type: string
 *               status:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook traité
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
 *       401:
 *         description: Signature webhook invalide
 */
router.post(
  '/webhook',
  validate(webhookSchema),
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
 *     tags: [Paiement]
 *     responses:
 *       200:
 *         description: Paiement réussi
 */
router.get('/success', paiementController.success.bind(paiementController));

/**
 * @swagger
 * /api/v1/paiement/cancel:
 *   get:
 *     summary: Page de redirection après paiement annulé
 *     tags: [Paiement]
 *     responses:
 *       400:
 *         description: Paiement annulé
 */
router.get('/cancel', paiementController.cancel.bind(paiementController));

export default router;
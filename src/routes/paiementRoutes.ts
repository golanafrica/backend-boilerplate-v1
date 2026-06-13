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
 * @route   POST /api/v1/paiement/initier
 * @desc    Initier un paiement Mobile Money
 * @access  Privé (utilisateur authentifié)
 */
router.post(
  '/initier',
  auth,
  validate(initierPaiementSchema),
  paiementController.initierPaiement.bind(paiementController)
);

/**
 * @route   POST /api/v1/paiement/webhook
 * @desc    Recevoir les webhooks de FedaPay
 * @access  Public (appelé par FedaPay)
 * @note    NE PAS mettre 'auth' ici - FedaPay n'a pas de JWT
 */
router.post(
  '/webhook',
  validate(webhookSchema),
  paiementController.webhook.bind(paiementController)
);

/**
 * @route   GET /api/v1/paiement/status/:id
 * @desc    Récupérer le statut d'une transaction
 * @access  Privé
 */
router.get(
  '/status/:id',
  auth,
  validate({ params: transactionIdParamSchema }),
  paiementController.getStatus.bind(paiementController)
);

/**
 * @route   GET /api/v1/paiement/history
 * @desc    Historique des transactions de l'utilisateur
 * @access  Privé
 */
router.get(
  '/history',
  auth,
  paiementController.getHistory.bind(paiementController)
);

/**
 * @route   GET /api/v1/paiement/success
 * @desc    Redirection après paiement réussi
 * @access  Public
 */
router.get('/success', paiementController.success.bind(paiementController));

/**
 * @route   GET /api/v1/paiement/cancel
 * @desc    Redirection après paiement annulé
 * @access  Public
 */
router.get('/cancel', paiementController.cancel.bind(paiementController));

export default router;
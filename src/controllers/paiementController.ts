import { Request, Response, NextFunction } from 'express';
import { paiementService } from '../services/paiement.service';
import { fedapayClient } from '../config/fedapay';
import { AppError } from '../utils/AppError';

export class PaiementController {
  /**
   * POST /api/v1/paiement/initier
   * Initier un paiement Mobile Money
   */
  async initierPaiement(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;  // ✅ Cast explicite
      const { amount, phone, description } = req.body;

      const result = await paiementService.initierPaiement(
        userId,
        amount,
        phone,
        description
      );

      res.status(201).json({
        success: true,
        message: 'Paiement initié avec succès',
        data: {
          transaction: {
            id: result.transaction.id,
            amount: result.transaction.amount,
            phone: result.transaction.phone,
            status: result.transaction.status,
            createdAt: result.transaction.createdAt,
          },
          paymentUrl: result.paymentUrl,
          token: result.token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/paiement/webhook
   * Recevoir les webhooks de FedaPay (endpoint PUBLIC)
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-fedapay-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      // 🔒 Vérifier la signature du webhook (sécurité)
      if (signature && !fedapayClient.verifyWebhookSignature(rawBody, signature)) {
        console.warn('[FedaPay Webhook] Signature invalide');
        return res.status(401).json({
          success: false,
          message: 'Signature webhook invalide',
        });
      }

      const transaction = await paiementService.handleWebhook(req.body);

      // Répondre immédiatement à FedaPay (ils attendent un 200)
      res.status(200).json({
        success: true,
        message: 'Webhook traité',
        transactionId: transaction.id,
        status: transaction.status,
      });
    } catch (error) {
      // Même en cas d'erreur, répondre 200 pour éviter les retries de FedaPay
      console.error('[FedaPay Webhook] Erreur:', error);
      res.status(200).json({
        success: false,
        message: 'Webhook reçu mais erreur de traitement',
      });
    }
  }

  /**
   * GET /api/v1/paiement/status/:id
   * Récupérer le statut d'une transaction
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;  // ✅ Cast explicite
      const transactionId = req.params.id as string;

      const transaction = await paiementService.getTransactionStatus(transactionId, userId);

      res.json({
        success: true,
        data: {
          id: transaction.id,
          amount: transaction.amount,
          phone: transaction.phone,
          status: transaction.status,
          fedapayId: transaction.fedapayId,
          createdAt: transaction.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/paiement/history
   * Historique des transactions de l'utilisateur connecté
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;  // ✅ Cast explicite
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await paiementService.getUserTransactions(userId, page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/paiement/success
   * Page de redirection après paiement réussi
   */
  async success(req: Request, res: Response) {
    res.json({
      success: true,
      message: 'Paiement réussi !',
      data: req.query,
    });
  }

  /**
   * GET /api/v1/paiement/cancel
   * Page de redirection après paiement annulé
   */
  async cancel(req: Request, res: Response) {
    res.status(400).json({
      success: false,
      message: 'Paiement annulé',
      data: req.query,
    });
  }
}

export const paiementController = new PaiementController();
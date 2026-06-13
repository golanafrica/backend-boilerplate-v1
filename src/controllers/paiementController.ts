import { Request, Response, NextFunction } from 'express';
import { paiementService } from '../services/paiement.service';
import { fedapayClient } from '../config/fedapay';

export class PaiementController {
  async initierPaiement(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { amount, phone, description } = req.body;

      const result = await paiementService.initierPaiement(
        userId, amount, phone, description
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
   * 🔒 Utilise req.rawBody (capturé par middleware dans routes)
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-fedapay-signature'] as string;
      
      // 🔒 Récupérer le raw body (capturé dans paiementRoutes.ts)
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (signature && !fedapayClient.verifyWebhookSignature(rawBody, signature)) {
        console.warn('[FedaPay Webhook] ❌ Signature invalide depuis', req.ip);
        return res.status(401).json({
          success: false,
          message: 'Signature webhook invalide',
        });
      }

      const transaction = await paiementService.handleWebhook(req.body);

      res.status(200).json({
        success: true,
        message: 'Webhook traité',
        transactionId: transaction.id,
        status: transaction.status,
      });
    } catch (error) {
      console.error('[FedaPay Webhook] Erreur:', error);
      // Toujours répondre 200 à FedaPay pour éviter les retries
      res.status(200).json({
        success: false,
        message: 'Webhook reçu mais erreur de traitement',
      });
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
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

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await paiementService.getUserTransactions(userId, page, limit);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async success(req: Request, res: Response) {
    res.json({
      success: true,
      message: 'Paiement réussi !',
      data: req.query,
    });
  }

  async cancel(req: Request, res: Response) {
    res.status(400).json({
      success: false,
      message: 'Paiement annulé',
      data: req.query,
    });
  }
}

export const paiementController = new PaiementController();
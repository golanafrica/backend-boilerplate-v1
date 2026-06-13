import { Request, Response, NextFunction } from 'express';
import { paiementService } from '../services/paiement.service';
import { PaymentFactory } from '../services/payment/PaymentFactory';

export class PaiementController {
  async initierPaiement(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { amount, phone, email, description, provider } = req.body;

      const result = await paiementService.initierPaiement(
        userId,
        amount,
        phone,
        email,
        description,
        provider
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
          provider: result.provider,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.query.provider as string || process.env.PAYMENT_PROVIDER || 'fedapay';
      const signature = req.headers[`${provider}-signature`] as string || 
                       req.headers['x-fedapay-signature'] as string ||
                       req.headers['stripe-signature'] as string;
      
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      // Vérifier la signature
      const paymentProvider = PaymentFactory.getProviderByName(provider);
      
      if (signature && !paymentProvider.verifyWebhookSignature(signature, rawBody)) {
        console.warn(`[${provider} Webhook] ❌ Signature invalide depuis`, req.ip);
        return res.status(401).json({
          success: false,
          message: 'Signature webhook invalide',
        });
      }

      const transaction = await paiementService.handleWebhook(req.body, provider);

      res.status(200).json({
        success: true,
        message: 'Webhook traité',
        transactionId: transaction.id,
        status: transaction.status,
      });
    } catch (error) {
      console.error('[Webhook] Erreur:', error);
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

  async getProviders(req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        current: process.env.PAYMENT_PROVIDER || 'fedapay',
        available: PaymentFactory.getAvailableProviders(),
      },
    });
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
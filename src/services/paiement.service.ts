import { prisma } from '../config/database';
import { PaymentFactory } from './payment/PaymentFactory';
import { AppError } from '../utils/AppError';

export class PaiementService {
  /**
   * Initier un paiement (multi-processeur)
   */
  async initierPaiement(
    userId: string,
    amount: number,
    phone: string | undefined,
    email: string | undefined,
    description: string,
    provider?: string
  ) {
    // 1. Créer la transaction en base (statut PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        phone: phone || '',
        status: 'PENDING',
      },
    });

    try {
      // 2. Récupérer le processeur (par défaut ou spécifique)
      const paymentProvider = provider 
        ? PaymentFactory.getProviderByName(provider)
        : PaymentFactory.getProvider();

      // 3. Créer le paiement via le processeur
      const paymentResult = await paymentProvider.createPayment({
        amount,
        phone,
        email,
        description,
        callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/paiement/callback`,
      });

      // 4. Mettre à jour la transaction avec l'ID du processeur
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          fedapayId: paymentResult.providerTransactionId, // On garde le champ pour compatibilité
        },
        include: {
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      return {
        transaction: updatedTransaction,
        paymentUrl: paymentResult.paymentUrl,
        token: paymentResult.token,
        provider: paymentResult.provider,
      };
    } catch (error) {
      // En cas d'erreur, marquer la transaction comme FAILED
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  /**
   * Gérer le webhook (multi-processeur)
   */
  async handleWebhook(payload: any, provider?: string) {
    // 1. Récupérer le processeur
    const paymentProvider = provider 
      ? PaymentFactory.getProviderByName(provider)
      : PaymentFactory.getProvider();

    // 2. Parser le webhook
    const webhookData = paymentProvider.parseWebhook(payload);

    if (!webhookData.providerTransactionId) {
      throw new AppError('Transaction ID manquant dans le webhook', 400);
    }

    // 3. Trouver la transaction dans notre base
    const transaction = await prisma.transaction.findFirst({
      where: { fedapayId: webhookData.providerTransactionId },
    });

    if (!transaction) {
      throw new AppError('Transaction non trouvée dans notre système', 404);
    }

    // 4. Mettre à jour le statut
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: webhookData.status },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    console.log(`[${paymentProvider.name} Webhook] Transaction ${transaction.id} → ${webhookData.status}`);

    return updatedTransaction;
  }

  /**
   * Récupérer le statut d'une transaction (multi-processeur)
   */
  async getTransactionStatus(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction non trouvée', 404);
    }

    // Si la transaction est encore PENDING, vérifier le statut auprès du processeur
    if (transaction.status === 'PENDING' && transaction.fedapayId) {
      try {
        const paymentProvider = PaymentFactory.getProvider();
        const statusData = await paymentProvider.getTransactionStatus(transaction.fedapayId);

        if (statusData.status !== 'PENDING') {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: statusData.status },
          });
          transaction.status = statusData.status;
        }
      } catch (error) {
        console.error('[Payment] Erreur lors de la vérification du statut:', error);
      }
    }

    return transaction;
  }

  /**
   * Historique des transactions d'un utilisateur
   */
  async getUserTransactions(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }
}

export const paiementService = new PaiementService();
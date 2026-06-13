import { prisma } from '../config/database';
import { fedapayClient } from '../config/fedapay';
import { AppError } from '../utils/AppError';

export class PaiementService {
  /**
   * Initier un paiement Mobile Money
   */
  async initierPaiement(
    userId: string,
    amount: number,
    phone: string,
    description: string
  ) {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        phone,
        status: 'PENDING',
      },
    });

    try {
      const fedapayResponse = await fedapayClient.createTransaction({
        amount,
        phone,
        description,
        callback_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/paiement/callback`,
      });

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          fedapayId: fedapayResponse.transaction?.id?.toString() || fedapayResponse.id?.toString(),
        },
        include: {
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      return {
        transaction: updatedTransaction,
        paymentUrl: fedapayResponse.url || null,
        token: fedapayResponse.token || null,
      };
    } catch (error) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  /**
   * Mapper un statut FedaPay vers notre statut
   * 🔒 Protection : gestion des valeurs null/undefined
   */
  private mapFedaPayStatus(rawStatus: any): 'PENDING' | 'SUCCESS' | 'FAILED' {
    const status = String(rawStatus || '').toLowerCase().trim();

    if (['approved', 'completed', 'successful', 'success'].includes(status)) {
      return 'SUCCESS';
    }
    if (['failed', 'rejected', 'cancelled', 'canceled', 'declined'].includes(status)) {
      return 'FAILED';
    }
    return 'PENDING';
  }

  /**
   * Gérer le webhook de FedaPay
   */
  async handleWebhook(payload: any) {
    const fedapayId = payload.transaction_id?.toString() || payload.id?.toString();

    if (!fedapayId) {
      throw new AppError('Transaction ID manquant dans le webhook', 400);
    }

    const transaction = await prisma.transaction.findFirst({
      where: { fedapayId },
    });

    if (!transaction) {
      throw new AppError('Transaction non trouvée dans notre système', 404);
    }

    const newStatus = this.mapFedaPayStatus(payload.status);

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: newStatus },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    console.log(`[FedaPay Webhook] Transaction ${transaction.id} → ${newStatus}`);

    return updatedTransaction;
  }

  /**
   * Récupérer le statut d'une transaction
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

    if (transaction.status === 'PENDING' && transaction.fedapayId) {
      try {
        const fedapayData = await fedapayClient.getTransaction(transaction.fedapayId);
        const fedapayStatus = fedapayData.transaction?.status || fedapayData.status;
        const newStatus = this.mapFedaPayStatus(fedapayStatus);

        if (newStatus !== 'PENDING') {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: newStatus },
          });
          transaction.status = newStatus;
        }
      } catch (error) {
        console.error('[FedaPay] Erreur lors de la vérification du statut:', error);
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
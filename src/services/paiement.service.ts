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
    // 1. Créer la transaction en base (statut PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        phone,
        status: 'PENDING',
      },
    });

    try {
      // 2. Appeler FedaPay pour créer le paiement
      const fedapayResponse = await fedapayClient.createTransaction({
        amount,
        phone,
        description,
        callback_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/paiement/callback`,
      });

      // 3. Mettre à jour la transaction avec l'ID FedaPay
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          fedapayId: fedapayResponse.transaction?.id?.toString() || fedapayResponse.id?.toString(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return {
        transaction: updatedTransaction,
        paymentUrl: fedapayResponse.url || null, // URL pour rediriger l'utilisateur
        token: fedapayResponse.token || null, // Token de paiement
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
   * Gérer le webhook de FedaPay
   */
  async handleWebhook(payload: any) {
    const fedapayId = payload.transaction_id?.toString() || payload.id?.toString();
    const status = payload.status;

    if (!fedapayId) {
      throw new AppError('Transaction ID manquant dans le webhook', 400);
    }

    // Trouver la transaction dans notre base
    const transaction = await prisma.transaction.findFirst({
      where: { fedapayId },
    });

    if (!transaction) {
      throw new AppError('Transaction non trouvée dans notre système', 404);
    }

    // Mapper le statut FedaPay vers notre statut
    let newStatus: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
    
    if (['approved', 'completed', 'successful', 'success'].includes(status?.toLowerCase())) {
      newStatus = 'SUCCESS';
    } else if (['failed', 'rejected', 'cancelled', 'canceled'].includes(status?.toLowerCase())) {
      newStatus = 'FAILED';
    }

    // Mettre à jour le statut
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
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
      where: {
        id: transactionId,
        userId, // Sécurité : vérifier que l'utilisateur est bien le propriétaire
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction non trouvée', 404);
    }

    // Si la transaction est encore PENDING, vérifier le statut auprès de FedaPay
    if (transaction.status === 'PENDING' && transaction.fedapayId) {
      try {
        const fedapayData = await fedapayClient.getTransaction(transaction.fedapayId);
        const fedapayStatus = fedapayData.transaction?.status || fedapayData.status;

        // Mettre à jour si le statut a changé
        if (['approved', 'completed', 'successful'].includes(fedapayStatus?.toLowerCase())) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'SUCCESS' },
          });
          transaction.status = 'SUCCESS';
        } else if (['failed', 'rejected', 'cancelled'].includes(fedapayStatus?.toLowerCase())) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'FAILED' },
          });
          transaction.status = 'FAILED';
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
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export class UserService {
  /**
   * Récupérer tous les utilisateurs (avec pagination)
   */
  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    return user;
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId: string, currentUserId: string) {
    // Empêcher la suppression de soi-même
    if (userId === currentUserId) {
      throw new AppError('Vous ne pouvez pas supprimer votre propre compte', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Supprimer les transactions associées
    await prisma.transaction.deleteMany({
      where: { userId },
    });

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return updatedUser;
  }
}

export const userService = new UserService();
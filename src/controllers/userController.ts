import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

// Définir le type localement
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tokenVersion: number;
  };
}

export class UserController {
  /**
   * GET /api/v1/users
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Paramètres de pagination invalides',
        });
      }

      const result = await userService.getAllUsers(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis',
        });
      }

      const user = await userService.getUserById(userId);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié',
        });
      }
      
      const currentUserId = req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis',
        });
      }

      const result = await userService.deleteUser(userId, currentUserId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/role
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string;
      const { role } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis',
        });
      }

      if (!role || !['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Rôle invalide. Doit être USER ou ADMIN',
        });
      }

      const user = await userService.updateUserRole(userId, role);

      res.json({
        success: true,
        message: 'Rôle mis à jour avec succès',
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from '../utils/AppError';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('Authentification requise', 401);
    }

    if (user.role !== 'ADMIN') {
      throw new AppError('Accès refusé - Droits administrateur requis', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
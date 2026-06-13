import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Erreur Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Cette valeur existe déjà',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Ressource non trouvée',
    });
  }

  // Erreur personnalisée
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Erreur par défaut
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
  });
};
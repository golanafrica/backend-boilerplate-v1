import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Middleware global de gestion des erreurs
 * Centralise tous les types d'erreurs possibles
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log de l'erreur pour debug
  console.error(`❌ [${req.method}] ${req.originalUrl}:`, err.message || err);

  // 1. Erreurs Prisma (conflit de contrainte)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') || 'champ';
      return res.status(409).json({
        success: false,
        message: `Conflit : cette valeur pour ${fields} existe déjà.`,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Ressource non trouvée.',
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Violation de contrainte de base de données.',
      });
    }
  }

  // 2. Erreurs Prisma (enregistrement non trouvé)
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides pour la base de données.',
    });
  }

  // 3. Erreurs Zod (validation)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // 4. Erreurs personnalisées (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 5. Erreurs JSON malformé (SyntaxError)
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON invalide dans la requête.',
    });
  }

  // 6. Erreur par défaut (500)
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Erreur interne du serveur',
  });
};
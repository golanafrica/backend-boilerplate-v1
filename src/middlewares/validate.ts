import { Request, Response, NextFunction } from 'express';
import { z, ZodTypeAny } from 'zod';

export interface ValidationOptions {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Middleware de validation Zod universel avec logging de sécurité
 * Accepte soit un schéma unique (pour le body, rétrocompatible), 
 * soit un objet de configuration pour body, query et params.
 */
export const validate = (schemaOrOptions: ZodTypeAny | ValidationOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Astuce TypeScript : vérifier si c'est un schéma Zod directement
      const options: ValidationOptions = 'parseAsync' in schemaOrOptions 
        ? { body: schemaOrOptions } 
        : (schemaOrOptions as ValidationOptions);

      // 1. Valider et RÉASSIGNER le body (permet les transformations Zod)
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }

      // 2. Valider et réassigner les query parameters (?page=1&limit=10)
      if (options.query) {
        req.query = await options.query.parseAsync(req.query) as any;
      }

      // 3. Valider et réassigner les paramètres d'URL (:id)
      if (options.params) {
        req.params = await options.params.parseAsync(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // 🔒 LOG DE SÉCURITÉ : Logger les tentatives de validation échouées
        console.warn(`[SECURITY] Validation failed for ${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            code: issue.code,
          })),
        });

        res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};
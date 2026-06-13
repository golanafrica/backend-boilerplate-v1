import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .max(255, 'Email trop long')
    .transform((email) => email.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .transform((email) => email.toLowerCase().trim()),
  
  password: z.string()
    .min(1, 'Le mot de passe est requis')
    .max(128, 'Mot de passe trop long'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token requis')
    .max(500, 'Token invalide'),
});
import { z } from 'zod';

/**
 * Schémas de validation pour les paiements Mobile Money
 * Adaptés au contexte burkinabè (numéros de téléphone, montants en FCFA)
 */

// Validation du numéro de téléphone burkinabè (8 chiffres, commence par 0 ou +226)
const burkinaPhoneRegex = /^(\+226|0)?[0-9]{8}$/;

export const initierPaiementSchema = z.object({
  amount: z.number()
    .int('Le montant doit être un nombre entier')
    .min(100, 'Le montant minimum est de 100 FCFA')
    .max(5000000, 'Le montant maximum est de 5 000 000 FCFA'),
  
  phone: z.string()
    .regex(burkinaPhoneRegex, 'Numéro de téléphone invalide (format: 07XXXXXXX ou +22607XXXXXXX)')
    .transform((phone) => {
      // Normaliser le numéro au format international
      if (phone.startsWith('0')) {
        return '+226' + phone.substring(1);
      }
      if (!phone.startsWith('+226')) {
        return '+226' + phone;
      }
      return phone;
    }),
  
  description: z.string()
    .min(3, 'La description doit faire au moins 3 caractères')
    .max(255, 'La description ne doit pas dépasser 255 caractères'),
});

export const webhookSchema = z.object({
  // Structure typique d'un webhook FedaPay
  id: z.string().optional(),
  transaction_id: z.string().optional(),
  status: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  signature: z.string().optional(),
}).passthrough(); // Accepte tous les autres champs

export const transactionIdParamSchema = z.object({
  id: z.string().uuid('ID de transaction invalide'),
});
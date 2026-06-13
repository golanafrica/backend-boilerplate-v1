import Stripe from 'stripe';

/**
 * Configuration Stripe
 * Documentation : https://stripe.com/docs/api
 */

let stripeInstance: InstanceType<typeof Stripe> | null = null;

/**
 * Récupérer l'instance Stripe (singleton)
 */
export const getStripe = (): InstanceType<typeof Stripe> => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  return stripeInstance;
};

/**
 * Vérifier si Stripe est configuré
 */
export const isStripeConfigured = (): boolean => {
  return !!process.env.STRIPE_SECRET_KEY;
};
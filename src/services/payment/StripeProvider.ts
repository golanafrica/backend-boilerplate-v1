import Stripe from 'stripe';
import { 
  PaymentProvider, 
  CreatePaymentParams, 
  PaymentResult, 
  TransactionStatus,
  WebhookPayload
} from './PaymentProvider';

/**
 * Adapter pour Stripe (International - Cartes bancaires)
 * Supporte : Visa, Mastercard, Apple Pay, Google Pay
 */
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe';
  private stripe: InstanceType<typeof Stripe>;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      // Créer une session de paiement Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency || 'eur',
              product_data: {
                name: params.description,
              },
              unit_amount: params.amount * 100, // Stripe utilise les centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: params.callbackUrl || process.env.STRIPE_SUCCESS_URL,
        cancel_url: process.env.STRIPE_CANCEL_URL,
        customer_email: params.email,
        metadata: params.metadata,
      });

      return {
        transactionId: session.id,
        providerTransactionId: session.id,
        paymentUrl: session.url || undefined,
        status: 'PENDING',
        provider: this.name,
      };
    } catch (error: any) {
      throw new Error(`Stripe payment creation failed: ${error.message}`);
    }
  }

  verifyWebhookSignature(signature: string, payload: string): boolean {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('[Stripe] STRIPE_WEBHOOK_SECRET not configured - skipping verification');
      return true;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return !!event;
    } catch (error) {
      console.error('[Stripe] Webhook signature verification failed:', error);
      return false;
    }
  }

  async getTransactionStatus(providerTransactionId: string): Promise<TransactionStatus> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(providerTransactionId);
      
      let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
      
      if (session.payment_status === 'paid') {
        status = 'SUCCESS';
      } else if (session.payment_status === 'unpaid' && session.status === 'expired') {
        status = 'FAILED';
      }

      return {
        id: session.id,
        providerTransactionId: session.id,
        status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase() || 'EUR',
        provider: this.name,
        metadata: {
          paymentIntent: session.payment_intent,
          customerEmail: session.customer_email,
        },
      };
    } catch (error: any) {
      throw new Error(`Stripe getTransactionStatus failed: ${error.message}`);
    }
  }

  parseWebhook(payload: any): WebhookPayload {
    const event = payload;
    
    // Extraire les infos selon le type d'événement Stripe
    let providerTransactionId = '';
    let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
    let amount = 0;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      providerTransactionId = session.id;
      status = session.payment_status === 'paid' ? 'SUCCESS' : 'PENDING';
      amount = session.amount_total ? session.amount_total / 100 : 0;
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      providerTransactionId = paymentIntent.id;
      status = 'FAILED';
      amount = paymentIntent.amount ? paymentIntent.amount / 100 : 0;
    }

    return {
      providerTransactionId,
      status,
      amount,
      rawPayload: payload,
    };
  }
}
/**
 * Interface commune pour tous les processeurs de paiement
 * Pattern Strategy - permet d'ajouter facilement de nouveaux processeurs
 */

export interface CreatePaymentParams {
  amount: number;
  phone?: string; // Pour Mobile Money
  email?: string; // Pour Stripe
  description: string;
  currency?: string; // 'XOF' pour FedaPay, 'EUR' pour Stripe
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  transactionId: string;
  providerTransactionId: string;
  paymentUrl?: string;
  token?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  provider: string;
}

export interface TransactionStatus {
  id: string;
  providerTransactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  currency: string;
  provider: string;
  metadata?: Record<string, any>;
}

export interface WebhookPayload {
  providerTransactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  rawPayload: any;
}

export interface PaymentProvider {
  /**
   * Nom du processeur (ex: 'fedapay', 'stripe')
   */
  readonly name: string;

  /**
   * Créer un nouveau paiement
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  /**
   * Vérifier la signature d'un webhook
   */
  verifyWebhookSignature(signature: string, payload: string): boolean;

  /**
   * Récupérer le statut d'une transaction
   */
  getTransactionStatus(providerTransactionId: string): Promise<TransactionStatus>;

  /**
   * Parser un webhook et extraire les informations
   */
  parseWebhook(payload: any): WebhookPayload;
}
import { 
  PaymentProvider, 
  CreatePaymentParams, 
  PaymentResult, 
  TransactionStatus,
  WebhookPayload
} from './PaymentProvider';
import { fedapayClient } from '../../config/fedapay';

/**
 * Adapter pour FedaPay (Mobile Money - Afrique de l'Ouest)
 * Supporte : Orange Money, MTN Money, Moov Money
 */
export class FedaPayProvider implements PaymentProvider {
  readonly name = 'fedapay';

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    if (!params.phone) {
      throw new Error('FedaPay requires a phone number for Mobile Money payments');
    }

    try {
      const response = await fedapayClient.createTransaction({
        amount: params.amount,
        phone: params.phone,
        description: params.description,
        callback_url: params.callbackUrl || process.env.FEDAPAY_SUCCESS_URL,
      });

      return {
        transactionId: response.transaction?.id?.toString() || response.id?.toString(),
        providerTransactionId: response.transaction?.id?.toString() || response.id?.toString(),
        paymentUrl: response.url || null,
        token: response.token || null,
        status: 'PENDING',
        provider: this.name,
      };
    } catch (error: any) {
      throw new Error(`FedaPay payment creation failed: ${error.message}`);
    }
  }

  verifyWebhookSignature(signature: string, payload: string): boolean {
    return fedapayClient.verifyWebhookSignature(payload, signature);
  }

  async getTransactionStatus(providerTransactionId: string): Promise<TransactionStatus> {
    try {
      const response = await fedapayClient.getTransaction(providerTransactionId);
      const status = response.transaction?.status || response.status;

      return {
        id: providerTransactionId,
        providerTransactionId,
        status: this.mapStatus(status),
        amount: parseInt(response.transaction?.amount || response.amount || '0'),
        currency: 'XOF',
        provider: this.name,
        metadata: response,
      };
    } catch (error: any) {
      throw new Error(`FedaPay getTransactionStatus failed: ${error.message}`);
    }
  }

  parseWebhook(payload: any): WebhookPayload {
    const providerTransactionId = payload.transaction_id?.toString() || payload.id?.toString();
    const status = this.mapStatus(payload.status);
    const amount = parseInt(payload.amount || '0');

    return {
      providerTransactionId,
      status,
      amount,
      rawPayload: payload,
    };
  }

  private mapStatus(rawStatus: any): 'PENDING' | 'SUCCESS' | 'FAILED' {
    const status = String(rawStatus || '').toLowerCase().trim();

    if (['approved', 'completed', 'successful', 'success'].includes(status)) {
      return 'SUCCESS';
    }
    if (['failed', 'rejected', 'cancelled', 'canceled', 'declined'].includes(status)) {
      return 'FAILED';
    }
    return 'PENDING';
  }
}
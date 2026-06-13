import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

/**
 * Client FedaPay personnalisé (API REST directe)
 * Remplace le SDK officiel vulnérable par un wrapper sécurisé
 * Documentation : https://docs.fedapay.com
 */
class FedaPayClient {
  private client: AxiosInstance;
  private webhookSecret: string;

  constructor() {
    const apiKey = process.env.FEDAPAY_API_KEY;
    const environment = process.env.FEDAPAY_ENVIRONMENT || 'sandbox';
    this.webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET || '';

    if (!apiKey) {
      throw new Error('FEDAPAY_API_KEY is not defined in environment variables');
    }

    const baseURL = environment === 'live'
      ? 'https://api.fedapay.com/v1'
      : 'https://api-sandbox.fedapay.com/v1';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'AfriStarter-Boilerplate/1.0.0',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[FedaPay API Error]', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async createTransaction(params: {
    amount: number;
    phone: string;
    description: string;
    callback_url?: string;
  }) {
    try {
      const response = await this.client.post('/transactions', {
        amount: params.amount.toString(),
        currency: 'XOF',
        description: params.description,
        callback_url: params.callback_url || process.env.FEDAPAY_SUCCESS_URL,
        customer: {
          phone_number: params.phone,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`FedaPay createTransaction failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTransaction(transactionId: string) {
    try {
      const response = await this.client.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`FedaPay getTransaction failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Vérifier la signature HMAC-SHA256 du webhook
   * 🔒 Protection : gestion des longueurs différentes + try/catch
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('[FedaPay] WEBHOOK_SECRET non configuré - vérification ignorée (DEV uniquement)');
      return true;
    }

    if (!signature || typeof signature !== 'string') {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      // 🔒 Sécurité : timingSafeEqual exige des buffers de même taille
      if (signature.length !== expectedSignature.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch (error) {
      console.error('[FedaPay] Erreur vérification signature:', error);
      return false;
    }
  }
}

export const fedapayClient = new FedaPayClient();
import { PaymentProvider } from './PaymentProvider';
import { FedaPayProvider } from './FedaPayProvider';
import { StripeProvider } from './StripeProvider';

/**
 * Factory pour créer le bon processeur de paiement
 * Utilise la variable d'environnement PAYMENT_PROVIDER
 */
export class PaymentFactory {
  private static providers: Map<string, PaymentProvider> = new Map();

  /**
   * Récupérer le processeur configuré
   */
  static getProvider(): PaymentProvider {
    const providerName = process.env.PAYMENT_PROVIDER || 'fedapay';

    // Cache le provider pour éviter de le recréer à chaque appel
    if (!this.providers.has(providerName)) {
      const provider = this.createProvider(providerName);
      this.providers.set(providerName, provider);
    }

    return this.providers.get(providerName)!;
  }

  /**
   * Récupérer un processeur spécifique par nom
   */
  static getProviderByName(name: string): PaymentProvider {
    if (!this.providers.has(name)) {
      const provider = this.createProvider(name);
      this.providers.set(name, provider);
    }

    return this.providers.get(name)!;
  }

  /**
   * Créer une instance du processeur
   */
  private static createProvider(name: string): PaymentProvider {
    switch (name.toLowerCase()) {
      case 'fedapay':
        return new FedaPayProvider();
      
      case 'stripe':
        return new StripeProvider();
      
      default:
        throw new Error(
          `Processeur de paiement inconnu: ${name}. ` +
          `Processeurs supportés: fedapay, stripe`
        );
    }
  }

  /**
   * Lister tous les processeurs disponibles
   */
  static getAvailableProviders(): string[] {
    return ['fedapay', 'stripe'];
  }

  /**
   * Vérifier si un processeur est configuré et disponible
   */
  static isProviderAvailable(name: string): boolean {
    try {
      this.getProviderByName(name);
      return true;
    } catch {
      return false;
    }
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);
  private cache = new Map<string, PaymentProvider>();

  constructor(private readonly moduleRef: ModuleRef) {}

  async get(providerName: string): Promise<PaymentProvider | null> {
    if (this.cache.has(providerName)) {
      return this.cache.get(providerName)!;
    }

    const token = this.getProviderToken(providerName);
    try {
      const provider = this.moduleRef.get(token, { strict: false }) as PaymentProvider | null;
      if (provider) {
        this.cache.set(providerName, provider);
        return provider;
      }
    } catch {
      this.logger.warn(`Payment provider ${providerName} não encontrado`);
    }

    return null;
  }

  private getProviderToken(name: string): string {
    const map: Record<string, string> = {
      MERCADO_PAGO: 'MercadoPagoProvider',
      STRIPE: 'StripeProvider',
      ASAAS: 'AsaasProvider',
    };
    return map[name] ?? `${name}Provider`;
  }
}

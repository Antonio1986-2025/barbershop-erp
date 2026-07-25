import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IntegrationProvider } from './integration-provider.interface';

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);
  private cache = new Map<string, IntegrationProvider>();

  constructor(private readonly moduleRef: ModuleRef) {}

  async get(providerName: string): Promise<IntegrationProvider | null> {
    if (this.cache.has(providerName)) {
      return this.cache.get(providerName)!;
    }

    try {
      const providerToken = this.getProviderToken(providerName);
      const provider = this.moduleRef.get(providerToken, { strict: false }) as IntegrationProvider | null;

      if (provider) {
        this.cache.set(providerName, provider);
        return provider;
      }
    } catch {
      this.logger.warn(`Provider ${providerName} não encontrado`);
    }

    return null;
  }

  register(provider: IntegrationProvider) {
    this.cache.set(provider.name, provider);
  }

  private getProviderToken(name: string): string {
    const map: Record<string, string> = {
      evolution: 'EvolutionProvider',
      google: 'GoogleProvider',
      payments: 'PaymentProvider',
    };
    return map[name] ?? `${name.charAt(0).toUpperCase() + name.slice(1)}Provider`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, ProviderCapability, CreatePaymentInput, PaymentResult, PaymentQueryResult } from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly name = 'STRIPE';
  private readonly logger = new Logger(StripeProvider.name);

  getCapabilities(): ProviderCapability[] { return ['CARD', 'CHECKOUT', 'SUBSCRIPTION', 'REFUND', 'WEBHOOK']; }
  getProviderInfo() { return { id: 'STRIPE', name: 'Stripe', version: 'v1', capabilities: this.getCapabilities(), supportsSandbox: true, supportsProduction: true }; }

  async createPayment(data: CreatePaymentInput): Promise<PaymentResult> {
    return { created: false, error: 'not_implemented' };
  }

  async getPayment(id: string, credentials?: any): Promise<PaymentQueryResult> {
    return { found: false, error: 'not_implemented' };
  }

  async cancelPayment(id: string, credentials?: any): Promise<{ cancelled: boolean; error?: string }> {
    return { cancelled: false, error: 'not_implemented' };
  }

  async refundPayment(id: string, amount?: number, credentials?: any): Promise<{ refunded: boolean; error?: string }> {
    return { refunded: false, error: 'not_implemented' };
  }

  validateWebhook(payload: any, signature?: string): boolean {
    return true;
  }

  async processWebhook(payload: any): Promise<{ event: string; externalPaymentId: string; status: string; data?: any }> {
    return { event: 'unknown', externalPaymentId: '', status: 'unknown' };
  }
}

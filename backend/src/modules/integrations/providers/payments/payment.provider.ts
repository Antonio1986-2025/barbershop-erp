import { Injectable } from '@nestjs/common';
import { IntegrationProvider, WebhookPayload, WebhookResult } from '../integration-provider.interface';

@Injectable()
export class PaymentProvider implements IntegrationProvider {
  readonly name = 'payments';

  validateWebhook(payload: WebhookPayload, secret: string): boolean {
    return true;
  }

  async processWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    return { handled: false, action: 'not_implemented' };
  }

  async sendMessage(destination: string, content: any, credentials?: any): Promise<any> {
    return { sent: false, error: 'not_implemented' };
  }

  async getStatus(credentials?: any): Promise<{ connected: boolean; lastPing?: Date }> {
    return { connected: false };
  }
}

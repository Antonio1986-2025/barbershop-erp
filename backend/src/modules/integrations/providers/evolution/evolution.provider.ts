import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IntegrationLogService } from '../../integration-log.service';
import {
  IntegrationProvider,
  WebhookPayload,
  WebhookResult,
  ProviderCredentials,
} from '../integration-provider.interface';

@Injectable()
export class EvolutionProvider implements IntegrationProvider {
  readonly name = 'evolution';
  private readonly logger = new Logger(EvolutionProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationLogService: IntegrationLogService,
  ) {}

  validateWebhook(payload: WebhookPayload, secret: string): boolean {
    const crypto = require('crypto');
    const data = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return payload.signature === expected;
  }

  async processWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    const body = payload.body ?? {};

    if (body.event === 'messages.upsert' && body.data?.key?.remoteJid) {
      const remoteJid = body.data.key.remoteJid;
      const phone = remoteJid.replace(/[^0-9]/g, '').slice(-11);
      const messageText = body.data.message?.conversation
        ?? body.data.message?.extendedTextMessage?.text
        ?? '';

      const customer = await this.prisma.customer.findFirst({
        where: { phone: { contains: phone.slice(-8) } },
      });

      if (customer) {
        await this.prisma.customerInteraction.create({
          data: {
            companyId: customer.companyId,
            customerId: customer.id,
            type: 'WHATSAPP',
            subject: messageText.slice(0, 100),
            description: messageText,
            createdBy: 'evolution',
            interactionAt: new Date(),
          },
        });
      }

      return {
        handled: true,
        action: 'message_received',
        data: { phone, customerId: customer?.id, text: messageText },
      };
    }

    if (body.event === 'connection.update') {
      return { handled: true, action: 'connection_update', data: body.data };
    }

    if (body.event === 'messages.upsert' && body.data?.key?.fromMe) {
      return { handled: true, action: 'message_sent', data: body.data };
    }

    return { handled: false, action: 'unknown' };
  }

  async sendMessage(destination: string, content: any, credentials?: ProviderCredentials): Promise<any> {
    if (!credentials) {
      return { sent: false, error: 'credentials_required' };
    }

    const { apiUrl, apiKey, instanceName } = credentials;
    const number = destination.replace(/[^0-9]/g, '');

    const text = typeof content === 'string' ? content : content.text;
    if (!text) return { sent: false, error: 'no_content' };

    try {
      const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': apiKey,
        },
        body: JSON.stringify({
          number: `55${number}`,
          text,
          delay: 1200,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? `HTTP ${response.status}`);
      }

      return { sent: true, response: result };
    } catch (err: any) {
      this.logger.error(`Evolution sendMessage falhou: ${err.message}`);
      return { sent: false, error: err.message };
    }
  }

  async getStatus(credentials?: ProviderCredentials): Promise<{ connected: boolean; lastPing?: Date }> {
    if (!credentials) return { connected: false };

    try {
      const response = await fetch(`${credentials.apiUrl}/instance/connectionState/${credentials.instanceName}`, {
        headers: { 'apiKey': credentials.apiKey },
      });
      const data = await response.json();
      return { connected: data?.state === 'open', lastPing: new Date() };
    } catch {
      return { connected: false };
    }
  }
}

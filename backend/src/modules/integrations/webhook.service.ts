import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationLogService } from './integration-log.service';
import { ProviderFactory } from './providers/provider-factory.service';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationLogService: IntegrationLogService,
    private readonly providerFactory: ProviderFactory,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) {}

  async handleWebhook(
    provider: string,
    companyId: string | null,
    body: any,
    signature?: string,
    headers?: Record<string, string>,
  ) {
    const integration = await this.prisma.integration.findFirst({
      where: {
        provider,
        companyId: companyId ?? undefined,
        active: true,
      },
    });

    if (!integration) {
      this.logger.warn(`Webhook recebido para provedor não configurado: ${provider}`);
      return { received: true, ignored: true };
    }

    const webhookPayload = { body, headers: headers ?? {}, signature };
    const providerHandler = await this.providerFactory.get(provider);

    if (providerHandler && integration.webhookSecret) {
      const valid = providerHandler.validateWebhook(webhookPayload, integration.webhookSecret);
      if (!valid) {
        await this.logAndUpdate(integration.id, 'FAILED', 'Assinatura inválida', webhookPayload);
        return { received: true, error: 'invalid signature' };
      }
    }

    try {
      if (providerHandler) {
        const result = await providerHandler.processWebhook(webhookPayload);

        if (result.action === 'message_received' && result.data?.customerId && result.data?.text) {
          try {
            await this.conversationsService.handleIncoming(
              integration.companyId,
              result.data.customerId,
              result.data.text,
              result.data.phone,
            );
          } catch (convErr: any) {
            this.logger.error(`Erro ao criar conversa: ${convErr.message}`);
          }
        }

        await this.logAndUpdate(integration.id, 'SUCCESS', null, { ...webhookPayload, result });
        return { received: true, integrationId: integration.id, result };
      }

      await this.logAndUpdate(integration.id, 'SUCCESS', null, webhookPayload);
      return { received: true, integrationId: integration.id };
    } catch (err: any) {
      await this.logAndUpdate(integration.id, 'FAILED', err.message, webhookPayload);
      return { received: true, error: err.message };
    }
  }

  private async logAndUpdate(integrationId: string, status: 'SUCCESS' | 'FAILED', error: string | null, payload: any) {
    await this.integrationLogService.log({
      integrationId,
      eventName: 'webhook',
      direction: 'INBOUND',
      payload,
      status,
      error: error ?? undefined,
    });

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastUsedAt: new Date() },
    });
  }
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationLogService } from './integration-log.service';
import { ProviderFactory } from './providers/provider-factory.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationLogService: IntegrationLogService,
    private readonly providerFactory: ProviderFactory,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.integration.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, companyId },
    });
    if (!integration) throw new NotFoundException('Integração não encontrada');
    return integration;
  }

  async create(companyId: string, data: {
    type: string;
    name: string;
    provider?: string;
    version?: string;
    credentials?: any;
    webhookSecret?: string;
  }) {
    return this.prisma.integration.create({
      data: {
        companyId,
        type: data.type,
        name: data.name,
        provider: data.provider,
        version: data.version ?? 'v1',
        credentials: data.credentials ? JSON.stringify(data.credentials) : null,
        webhookSecret: data.webhookSecret,
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    const updateData: any = { ...data };
    if (data.credentials) updateData.credentials = JSON.stringify(data.credentials);
    return this.prisma.integration.update({ where: { id }, data: updateData });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.integration.update({
      where: { id },
      data: { active: false },
    });
  }

  async getLogs(companyId: string, id: string, query: { page?: string; limit?: string }) {
    await this.findOne(companyId, id);
    return this.integrationLogService.findAll(id, query);
  }

  async syncCalendarEvent(companyId: string, integrationId: string, action: string, eventData: {
    externalId?: string; title: string; description?: string; start: Date; end: Date; attendeeEmail?: string;
  }) {
    const integration = await this.findOne(companyId, integrationId);
    if (!integration.active) throw new BadRequestException('Integração inativa');

    const provider = await this.providerFactory.get(integration.provider ?? 'google_calendar');
    if (!provider) throw new BadRequestException('Provider google_calendar não encontrado');

    const credentials = integration.credentials ? JSON.parse(integration.credentials) : undefined;
    const start = Date.now();

    try {
      let result: any;

      if (action === 'create') {
        result = await (provider as any).createEvent(eventData, credentials);
      } else if (action === 'update' && eventData.externalId) {
        result = await (provider as any).updateEvent(eventData.externalId, eventData, credentials);
      } else if (action === 'delete' && eventData.externalId) {
        result = await (provider as any).deleteEvent(eventData.externalId, credentials);
      } else {
        throw new BadRequestException(`Ação inválida: ${action}`);
      }

      await this.integrationLogService.log({
        integrationId,
        eventName: `calendar.${action}`,
        direction: 'OUTBOUND',
        payload: eventData,
        status: (result?.created ?? result?.updated ?? result?.deleted) ? 'SUCCESS' : 'FAILED',
        error: result?.error,
      });

      await this.prisma.integration.update({ where: { id: integrationId }, data: { lastUsedAt: new Date() } });

      return result;
    } catch (err: any) {
      await this.integrationLogService.log({
        integrationId, eventName: `calendar.${action}`, direction: 'OUTBOUND',
        payload: eventData, status: 'FAILED', error: err.message,
      });
      return { [action === 'create' ? 'created' : action === 'update' ? 'updated' : 'deleted']: false, error: err.message };
    }
  }

  async sendMessage(companyId: string, integrationId: string, destination: string, text: string) {
    const integration = await this.findOne(companyId, integrationId);

    if (!integration.active) {
      throw new BadRequestException('Integração inativa');
    }

    const provider = await this.providerFactory.get(integration.provider ?? integration.type);
    if (!provider) {
      throw new BadRequestException(`Provider ${integration.provider} não encontrado`);
    }

    const credentials = integration.credentials ? JSON.parse(integration.credentials) : undefined;

    const start = Date.now();
    try {
      const result = await provider.sendMessage(destination, { text, integrationId }, credentials);

      await this.integrationLogService.log({
        integrationId,
        eventName: 'send_message',
        direction: 'OUTBOUND',
        payload: { destination, text, result },
        status: result.sent ? 'SUCCESS' : 'FAILED',
        error: result.error,
      });

      await this.prisma.integration.update({
        where: { id: integrationId },
        data: { lastUsedAt: new Date() },
      });

      return result;
    } catch (err: any) {
      await this.integrationLogService.log({
        integrationId,
        eventName: 'send_message',
        direction: 'OUTBOUND',
        payload: { destination, text },
        status: 'FAILED',
        error: err.message,
      });

      return { sent: false, error: err.message };
    }
  }
}

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationLogService } from './integration-log.service';
import { PaymentProviderFactory } from './providers/payment/payment-provider-factory.service';

@Injectable()
export class PaymentProviderService {
  private readonly logger = new Logger(PaymentProviderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationLogService: IntegrationLogService,
    private readonly paymentProviderFactory: PaymentProviderFactory,
  ) {}

  async createPayment(companyId: string, paymentId: string, providerName: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      include: { sale: { include: { customer: true } } },
    });
    if (!payment) throw new BadRequestException('Pagamento não encontrado');

    const provider = await this.paymentProviderFactory.get(providerName);
    if (!provider) throw new BadRequestException(`Provider ${providerName} não disponível`);

    const integration = await this.prisma.integration.findFirst({
      where: { companyId, type: 'PAYMENT', provider: providerName, active: true },
    });
    if (!integration) throw new BadRequestException(`Integração ${providerName} não configurada`);

    const credentials = integration.credentials ? JSON.parse(integration.credentials) : undefined;

    const result = await provider.createPayment({
      amount: Number(payment.amount),
      description: `Pagamento ${payment.saleId ?? payment.serviceOrderId ?? payment.id}`,
      customerName: payment.sale?.customer?.name ?? undefined,
      customerEmail: payment.sale?.customer?.email ?? undefined,
      externalReference: payment.id,
      credentials,
    });

    if (result.created) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          externalPaymentId: result.externalPaymentId,
          provider: providerName,
          providerStatus: result.status,
          paymentUrl: result.paymentUrl,
          pixCode: result.pixCode,
        },
      });
    }

    await this.integrationLogService.log({
      integrationId: integration.id,
      eventName: 'payment.create',
      direction: 'OUTBOUND',
      payload: { paymentId, provider: providerName, result },
      status: result.created ? 'SUCCESS' : 'FAILED',
      error: result.error,
    });

    return result;
  }

  async processWebhook(providerName: string, body: any, signature?: string) {
    const provider = await this.paymentProviderFactory.get(providerName);
    if (!provider) return { received: true, ignored: true };

    const integration = await this.prisma.integration.findFirst({
      where: { provider: providerName, type: 'PAYMENT', active: true },
    });

    if (!integration) return { received: true, ignored: true };

    const valid = provider.validateWebhook(body, signature);
    if (!valid) {
      await this.integrationLogService.log({
        integrationId: integration.id, eventName: 'payment.webhook',
        direction: 'INBOUND', payload: body, status: 'FAILED', error: 'invalid signature',
      });
      return { received: true, error: 'invalid signature' };
    }

    try {
      const event = await provider.processWebhook(body);

      if (event.externalPaymentId) {
        const payment = await this.prisma.payment.findFirst({
          where: { externalPaymentId: event.externalPaymentId },
        });

        if (payment) {
          const statusMap: Record<string, string> = {
            approved: 'PAID', paid: 'PAID', completed: 'PAID',
            cancelled: 'CANCELED', refunded: 'REFUNDED',
          };

          const newStatus = statusMap[event.status] ?? payment.status;
          if (newStatus !== payment.status) {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: newStatus as any,
                providerStatus: event.status,
                paidAt: newStatus === 'PAID' ? new Date() : payment.paidAt,
              },
            });
          }
        }
      }

      await this.integrationLogService.log({
        integrationId: integration.id, eventName: 'payment.webhook',
        direction: 'INBOUND', payload: body, status: 'SUCCESS',
      });

      return { received: true, event: event.event, status: event.status };
    } catch (err: any) {
      await this.integrationLogService.log({
        integrationId: integration.id, eventName: 'payment.webhook',
        direction: 'INBOUND', payload: body, status: 'FAILED', error: err.message,
      });
      return { received: true, error: err.message };
    }
  }
}

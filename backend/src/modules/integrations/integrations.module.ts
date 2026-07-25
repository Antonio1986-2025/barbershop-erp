import { Module, Global, forwardRef } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationLogService } from './integration-log.service';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { DomainEventBus } from './domain-event-bus.service';
import { ProviderFactory } from './providers/provider-factory.service';
import { EvolutionProvider } from './providers/evolution/evolution.provider';
import { GoogleProvider } from './providers/google/google.provider';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentProviderFactory } from './providers/payment/payment-provider-factory.service';
import { MercadoPagoProvider } from './providers/payment/mercadopago.provider';
import { StripeProvider } from './providers/payment/stripe.provider';
import { AsaasProvider } from './providers/payment/asaas.provider';
import { ConversationsModule } from '../conversations/conversations.module';

@Global()
@Module({
  imports: [forwardRef(() => ConversationsModule)],
  controllers: [WebhookController],
  providers: [
    IntegrationsService,
    IntegrationLogService,
    WebhookService,
    DomainEventBus,
    ProviderFactory,
    EvolutionProvider,
    GoogleProvider,
    PaymentProviderService,
    PaymentProviderFactory,
    MercadoPagoProvider,
    StripeProvider,
    AsaasProvider,
  ],
  exports: [
    IntegrationsService,
    IntegrationLogService,
    WebhookService,
    DomainEventBus,
    ProviderFactory,
    PaymentProviderService,
    PaymentProviderFactory,
  ],
})
export class IntegrationsModule {}

import {
  Controller, Post, Param, Body, Headers, Req, HttpCode,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { PaymentProviderService } from './payment-provider.service';

@Controller('integrations/webhooks')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly paymentProviderService: PaymentProviderService,
  ) {}

  @Post(':provider')
  @HttpCode(200)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers('x-webhook-signature') signature?: string,
    @Headers('x-company-id') companyId?: string,
    @Req() req?: any,
  ) {
    const headers = req?.headers ? Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, String(v)]),
    ) : {};

    return this.webhookService.handleWebhook(
      provider,
      companyId ?? null,
      body,
      signature,
      headers,
    );
  }

  @Post('payment/:provider')
  @HttpCode(200)
  async handlePaymentWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.paymentProviderService.processWebhook(provider, body, signature);
  }
}

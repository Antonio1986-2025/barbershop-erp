import { MercadoPagoProvider } from '../../../src/modules/integrations/providers/payment/mercadopago.provider';

describe('MercadoPagoProvider', () => {
  let provider: MercadoPagoProvider;

  beforeEach(() => {
    provider = new MercadoPagoProvider();
  });

  describe('createPayment', () => {
    it('deve retornar erro sem accessToken', async () => {
      const result = await provider.createPayment({ amount: 100, description: 'teste' });
      expect(result.created).toBe(false);
      expect(result.error).toBe('access_token_required');
    });

    it('deve tentar criar PIX', async () => {
      const result = await provider.createPayment({
        amount: 50,
        description: 'PIX teste',
        paymentMethod: 'PIX',
        credentials: { accessToken: 'fake-token' },
      });
      expect(result.created).toBe(false);
    });
  });

  describe('validateWebhook', () => {
    it('deve rejeitar webhook sem assinatura', () => {
      expect(provider.validateWebhook({}, undefined)).toBe(false);
    });
  });

  describe('processWebhook', () => {
    it('deve processar payment.created', async () => {
      const result = await provider.processWebhook({
        action: 'payment.created',
        data: { id: '12345' },
      });
      expect(result.event).toBe('payment.created');
      expect(result.externalPaymentId).toBe('12345');
    });

    it('deve processar evento desconhecido', async () => {
      const result = await provider.processWebhook({ action: 'test.ping' });
      expect(result.event).toBe('test.ping');
    });
  });

  describe('getPayment', () => {
    it('deve retornar erro sem credentials', async () => {
      const result = await provider.getPayment('123');
      expect(result.found).toBe(false);
    });
  });

  describe('cancelPayment', () => {
    it('deve retornar erro sem credentials', async () => {
      const result = await provider.cancelPayment('123');
      expect(result.cancelled).toBe(false);
    });
  });

  describe('refundPayment', () => {
    it('deve retornar erro sem credentials', async () => {
      const result = await provider.refundPayment('123');
      expect(result.refunded).toBe(false);
    });
  });
});

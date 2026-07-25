import { Test, TestingModule } from '@nestjs/testing';
import { EvolutionProvider } from '../../../src/modules/integrations/providers/evolution/evolution.provider';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { IntegrationLogService } from '../../../src/modules/integrations/integration-log.service';

describe('EvolutionProvider', () => {
  let provider: EvolutionProvider;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', companyId: 'company-1', name: 'João' }),
      },
      customerInteraction: {
        create: jest.fn().mockResolvedValue({ id: 'int-1' }),
      },
    };

    const integrationLogService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvolutionProvider,
        { provide: PrismaService, useValue: prisma },
        { provide: IntegrationLogService, useValue: integrationLogService },
      ],
    }).compile();

    provider = module.get<EvolutionProvider>(EvolutionProvider);
  });

  describe('validateWebhook', () => {
    it('deve validar assinatura correta', () => {
      const payload = { body: { event: 'test' }, headers: {}, signature: '' };
      const result = provider.validateWebhook(payload, 'invalid-secret');
      expect(result).toBe(false);
    });
  });

  describe('processWebhook', () => {
    it('deve processar mensagem recebida e criar interação', async () => {
      const payload = {
        body: {
          event: 'messages.upsert',
          data: {
            key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: false },
            message: { conversation: 'Olá, gostaria de um corte' },
          },
        },
        headers: {},
      };

      const result = await provider.processWebhook(payload);
      expect(result.action).toBe('message_received');
      expect(prisma.customerInteraction.create).toHaveBeenCalled();
    });

    it('deve processar atualização de conexão', async () => {
      const payload = {
        body: { event: 'connection.update', data: { state: 'open' } },
        headers: {},
      };

      const result = await provider.processWebhook(payload);
      expect(result.action).toBe('connection_update');
    });

    it('deve retornar unknown para eventos desconhecidos', async () => {
      const payload = { body: { event: 'unknown.event' }, headers: {} };
      const result = await provider.processWebhook(payload);
      expect(result.action).toBe('unknown');
      expect(result.handled).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('deve retornar erro se sem credentials', async () => {
      const result = await provider.sendMessage('5511999999999', { text: 'teste' });
      expect(result.sent).toBe(false);
      expect(result.error).toBe('credentials_required');
    });
  });

  describe('getStatus', () => {
    it('deve retornar desconectado sem credentials', async () => {
      const result = await provider.getStatus();
      expect(result.connected).toBe(false);
    });
  });
});

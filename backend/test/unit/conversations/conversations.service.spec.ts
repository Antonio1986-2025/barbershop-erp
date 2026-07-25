import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from '../../../src/modules/conversations/conversations.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { IntegrationsService } from '../../../src/modules/integrations/integrations.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let prisma: any;

  const mockConversation = {
    id: 'conv-1',
    companyId: 'company-1',
    customerId: 'cust-1',
    channel: 'WHATSAPP',
    status: 'OPEN',
    assignedToId: null,
    lastMessageAt: null,
    customer: { id: 'cust-1', name: 'João', phone: '5511999999999' },
    _count: { messages: 0 },
  };

  beforeEach(async () => {
    prisma = {
      conversation: {
        findMany: jest.fn().mockResolvedValue([mockConversation]),
        findFirst: jest.fn().mockResolvedValue(mockConversation),
        create: jest.fn().mockResolvedValue(mockConversation),
        update: jest.fn().mockResolvedValue(mockConversation),
        count: jest.fn().mockResolvedValue(1),
      },
      conversationMessage: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'msg-1', direction: 'OUTBOUND', content: 'teste' }),
        count: jest.fn().mockResolvedValue(0),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', companyId: 'company-1', phone: '5511999999999' }),
      },
      integration: {
        findFirst: jest.fn().mockResolvedValue({ id: 'int-1', companyId: 'company-1', provider: 'evolution', active: true }),
      },
    };

    const auditService = { create: jest.fn() };
    const integrationsService = { sendMessage: jest.fn().mockResolvedValue({ sent: true }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: IntegrationsService, useValue: integrationsService },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('deve listar conversas', async () => {
    const result = await service.findAll('company-1', {});
    expect(result.data).toHaveLength(1);
  });

  it('deve retornar conversa', async () => {
    const result = await service.findOne('company-1', 'conv-1');
    expect(result.id).toBe('conv-1');
  });

  it('deve lancar NotFound', async () => {
    prisma.conversation.findFirst.mockResolvedValue(null);
    await expect(service.findOne('company-1', 'not-found')).rejects.toThrow(NotFoundException);
  });

  it('deve enviar mensagem', async () => {
    const result = await service.sendMessage('company-1', 'conv-1', 'user-1', 'Olá');
    expect(result.content).toBe('teste');
  });

  it('deve fechar conversa', async () => {
    const result = await service.close('company-1', 'conv-1', 'user-1');
    expect(result).toBeDefined();
  });

  it('deve tratar mensagem inbound', async () => {
    prisma.conversation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.conversationMessage.create.mockResolvedValue({ id: 'msg-2', direction: 'INBOUND', content: 'Olá' });

    const result = await service.handleIncoming('company-1', 'cust-1', 'Olá, gostaria de info');
    expect(result.conversation.channel).toBe('WHATSAPP');
    expect(result.message.direction).toBe('INBOUND');
  });
});

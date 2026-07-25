import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from '../../../src/modules/campaign/campaign.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CampaignService', () => {
  let service: CampaignService;
  let prisma: any;

  const mockCampaign = {
    id: 'camp-1',
    companyId: 'company-1',
    segmentId: null,
    name: 'Promoção de Natal',
    description: 'Campanha de fim de ano',
    type: 'WHATSAPP',
    status: 'DRAFT',
    messageTemplate: 'Olá {{nome}}, promoção especial!',
    scheduledAt: null,
    sentAt: null,
    totalRecipients: 0,
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    readCount: 0,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    segment: null,
    _count: { recipients: 0 },
  };

  beforeEach(async () => {
    prisma = {
      campaign: {
        findMany: jest.fn().mockResolvedValue([mockCampaign]),
        findFirst: jest.fn().mockResolvedValue(mockCampaign),
        create: jest.fn().mockResolvedValue(mockCampaign),
        update: jest.fn().mockResolvedValue(mockCampaign),
        delete: jest.fn().mockResolvedValue(mockCampaign),
      },
      campaignRecipient: {
        create: jest.fn().mockResolvedValue({ id: 'rec-1', campaignId: 'camp-1', customerId: 'cust-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      customerSegment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'seg-1', companyId: 'company-1' }),
      },
      customer: {
        findMany: jest.fn().mockResolvedValue([{ id: 'cust-1' }, { id: 'cust-2' }]),
        findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', companyId: 'company-1' }),
      },
    };

    const auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve listar campanhas', async () => {
      const result = await service.findAll('company-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar campanha', async () => {
      const result = await service.findOne('company-1', 'camp-1');
      expect(result.id).toBe('camp-1');
    });

    it('deve lancar NotFoundException', async () => {
      prisma.campaign.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar campanha', async () => {
      const dto = { name: 'Teste', type: 'EMAIL', messageTemplate: 'Olá' };
      const result = await service.create('company-1', 'user-1', dto as any);
      expect(result.id).toBe('camp-1');
      expect(prisma.campaign.create).toHaveBeenCalled();
    });

    it('deve validar segmento', async () => {
      prisma.customerSegment.findFirst.mockResolvedValue(null);
      const dto = { name: 'Teste', type: 'EMAIL', segmentId: 'seg-invalido' };
      await expect(service.create('company-1', 'user-1', dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('deve atualizar campanha em DRAFT', async () => {
      const result = await service.update('company-1', 'camp-1', 'user-1', { name: 'Novo nome' });
      expect(result.id).toBe('camp-1');
    });

    it('deve rejeitar edicao se nao for DRAFT', async () => {
      prisma.campaign.findFirst.mockResolvedValue({ ...mockCampaign, status: 'SENT' });
      await expect(service.update('company-1', 'camp-1', 'user-1', { name: 'Teste' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover campanha em DRAFT', async () => {
      await service.remove('company-1', 'camp-1', 'user-1');
      expect(prisma.campaign.delete).toHaveBeenCalled();
    });
  });

  describe('recipients', () => {
    it('deve adicionar destinatarios', async () => {
      const result = await service.addRecipients('company-1', 'camp-1', 'user-1', ['cust-1', 'cust-2']);
      expect(result).toHaveLength(2);
      expect(prisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'camp-1' },
          data: { totalRecipients: { increment: 2 } },
        }),
      );
    });

    it('deve listar destinatarios', async () => {
      const result = await service.getRecipients('company-1', 'camp-1');
      expect(result).toBeDefined();
    });
  });
});

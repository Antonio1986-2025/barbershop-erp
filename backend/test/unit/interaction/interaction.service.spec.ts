import { Test, TestingModule } from '@nestjs/testing';
import { InteractionService } from '../../../src/modules/interaction/interaction.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('InteractionService', () => {
  let service: InteractionService;
  let prisma: any;

  const mockInteraction = {
    id: 'int-1',
    companyId: 'company-1',
    customerId: 'cust-1',
    type: 'NOTE',
    subject: 'Cliente solicitou orçamento',
    description: 'Interessado em produtos premium',
    createdBy: 'user-1',
    createdAt: new Date(),
    customer: { id: 'cust-1', name: 'João' },
  };

  beforeEach(async () => {
    prisma = {
      customerInteraction: {
        findMany: jest.fn().mockResolvedValue([mockInteraction]),
        findFirst: jest.fn().mockResolvedValue(mockInteraction),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockInteraction),
        update: jest.fn().mockResolvedValue(mockInteraction),
        delete: jest.fn().mockResolvedValue(mockInteraction),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', companyId: 'company-1' }),
      },
    };

    const auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<InteractionService>(InteractionService);
  });

  it('deve listar interações', async () => {
    const result = await service.findAll('company-1', {});
    expect(result.data).toHaveLength(1);
  });

  it('deve criar interação', async () => {
    const result = await service.create('company-1', 'user-1', {
      customerId: 'cust-1', type: 'NOTE', subject: 'Teste',
    } as any);
    expect(result.id).toBe('int-1');
  });

  it('deve lancar NotFoundException', async () => {
    prisma.customerInteraction.findFirst.mockResolvedValue(null);
    await expect(service.findOne('company-1', 'not-found')).rejects.toThrow(NotFoundException);
  });
});

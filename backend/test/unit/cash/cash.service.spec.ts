import { Test, TestingModule } from '@nestjs/testing';
import { CashService } from '../../../src/modules/cash/cash.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { FinancialService } from '../../../src/modules/financial/financial.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CashService', () => {
  let service: CashService;
  let prisma: any;

  const mockRegister = {
    id: 'cr-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    status: 'OPEN',
    openingAmount: 100,
    closingAmount: null,
    openedBy: 'user-1',
    closedBy: null,
    openedAt: new Date(),
    closedAt: null,
    notes: null,
    transactions: [],
    closings: [],
    _count: { transactions: 0 },
  };

  beforeEach(async () => {
    prisma = {
      cashRegister: {
        findFirst: jest.fn().mockResolvedValue(mockRegister),
        findMany: jest.fn().mockResolvedValue([mockRegister]),
        create: jest.fn().mockResolvedValue(mockRegister),
        update: jest.fn().mockResolvedValue(mockRegister),
      },
      cashTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'ct-1', type: 'ENTRY', amount: 100, description: 'teste' }),
      },
    };

    const auditService = { create: jest.fn() };
    const financialService = {
      createCashClosing: jest.fn().mockResolvedValue({ id: 'cc-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: FinancialService, useValue: financialService },
      ],
    }).compile();

    service = module.get<CashService>(CashService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('open', () => {
    it('deve abrir caixa', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);
      prisma.cashRegister.create.mockResolvedValue(mockRegister);

      const result = await service.open('company-1', 'user-1', { unitId: 'unit-1', openingAmount: 100 });
      expect(result.id).toBe('cr-1');
      expect(prisma.cashRegister.create).toHaveBeenCalled();
    });

    it('deve rejeitar segundo caixa aberto', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(mockRegister);
      await expect(
        service.open('company-1', 'user-1', { unitId: 'unit-1', openingAmount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('current', () => {
    it('deve retornar caixa atual com saldo', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({
        ...mockRegister,
        transactions: [
          { type: 'ENTRY', amount: 50 },
          { type: 'EXIT', amount: 30 },
        ],
      });

      const result = await service.current('company-1', 'unit-1');
      expect(result.currentBalance).toBe(120);
    });

    it('deve retornar null se nao ha caixa aberto', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);
      const result = await service.current('company-1', 'unit-1');
      expect(result).toBeNull();
    });
  });

  describe('close', () => {
    it('deve fechar caixa', async () => {
      const result = await service.close('company-1', 'cr-1', 'user-1', {});
      expect(result.id).toBe('cc-1');
    });

    it('deve rejeitar fechamento se caixa ja fechado', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);
      await expect(
        service.close('company-1', 'cr-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reopen', () => {
    it('deve reabrir caixa fechado', async () => {
      prisma.cashRegister.findFirst.mockResolvedValueOnce({ ...mockRegister, status: 'CLOSED' });
      prisma.cashRegister.findFirst.mockResolvedValueOnce(null);

      const result = await service.reopen('company-1', 'cr-1', 'user-1');
      expect(result.status).toBe('OPEN');
    });

    it('deve rejeitar reabertura se caixa ja aberto', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(mockRegister);
      await expect(
        service.reopen('company-1', 'cr-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('supply', () => {
    it('deve registrar suprimento', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(mockRegister);
      const result = await service.supply('company-1', 'cr-1', 'user-1', { amount: 200, description: 'Troco' });
      expect(prisma.cashTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'ENTRY',
            amount: 200,
          }),
        }),
      );
    });
  });

  describe('withdraw', () => {
    it('deve registrar sangria', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(mockRegister);
      const result = await service.withdraw('company-1', 'cr-1', 'user-1', { amount: 50, description: 'Pagamento fornecedor' });
      expect(prisma.cashTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'EXIT',
            amount: 50,
          }),
        }),
      );
    });
  });

  describe('summary', () => {
    it('deve retornar resumo do caixa', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({
        ...mockRegister,
        transactions: [
          { id: 't1', type: 'ENTRY', amount: 50, description: 'Venda', paymentId: null, createdAt: new Date() },
        ],
        closings: [],
      });

      const result = await service.summary('company-1', 'cr-1');
      expect(result.entries).toBe(50);
      expect(result.exits).toBe(0);
      expect(result.expectedBalance).toBe(150);
    });

    it('deve lancar NotFoundException', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);
      await expect(service.summary('company-1', 'not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('history', () => {
    it('deve listar historico de caixas', async () => {
      const result = await service.history('company-1');
      expect(result).toHaveLength(1);
    });
  });
});

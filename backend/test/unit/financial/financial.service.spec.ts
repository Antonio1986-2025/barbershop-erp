import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from '../../../src/modules/financial/financial.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FinancialService', () => {
  let service: FinancialService;
  let prisma: any;
  let auditService: any;

  const mockCategory = {
    id: 'cat-1',
    companyId: 'company-1',
    name: 'Aluguel',
    type: 'EXPENSE',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount = {
    id: 'acc-1',
    companyId: 'company-1',
    categoryId: 'cat-1',
    description: 'Aluguel do mês',
    type: 'PAYABLE',
    status: 'OPEN',
    amount: 1500,
    dueDate: new Date('2026-08-15'),
    paidAt: null,
    paymentId: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-1', name: 'Aluguel', type: 'EXPENSE' },
  };

  const mockRegister = {
    id: 'reg-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    status: 'OPEN',
    openingAmount: 500,
    openedAt: new Date(),
    closedAt: null,
    closedBy: null,
    transactions: [
      { type: 'ENTRY', amount: 200 },
      { type: 'EXIT', amount: 50 },
    ],
  };

  const mockClosing = {
    id: 'close-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    cashRegisterId: 'reg-1',
    openedAt: new Date(),
    closedAt: new Date(),
    openingAmount: 500,
    expectedAmount: 650,
    closingAmount: 650,
    difference: 0,
    closedBy: 'user-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      financialCategory: {
        findMany: jest.fn().mockResolvedValue([mockCategory]),
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue(mockCategory),
        update: jest.fn().mockResolvedValue(mockCategory),
      },
      financialAccount: {
        findMany: jest.fn().mockResolvedValue([mockAccount]),
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockAccount),
        update: jest.fn().mockResolvedValue(mockAccount),
      },
      cashRegister: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue(mockRegister),
      },
      cashClosing: {
        create: jest.fn().mockResolvedValue(mockClosing),
        findMany: jest.fn().mockResolvedValue([mockClosing]),
      },
      cashTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<FinancialService>(FinancialService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('Categories', () => {
    it('findCategories deve retornar categorias ativas', async () => {
      const result = await service.findCategories('company-1');
      expect(result).toHaveLength(1);
      expect(prisma.financialCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1', active: true },
        }),
      );
    });

    it('createCategory deve criar e auditar', async () => {
      const result = await service.createCategory('company-1', 'user-1', {
        name: 'Aluguel',
        type: 'EXPENSE',
      });
      expect(result.name).toBe('Aluguel');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'FinancialCategory' }),
      );
    });

    it('updateCategory deve atualizar e auditar', async () => {
      prisma.financialCategory.findFirst.mockResolvedValue(mockCategory);
      const result = await service.updateCategory('company-1', 'cat-1', 'user-1', {
        name: 'Aluguel Novo',
      });
      expect(result.name).toBe('Aluguel');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });

    it('updateCategory deve lançar NotFoundException', async () => {
      prisma.financialCategory.findFirst.mockResolvedValue(null);
      await expect(
        service.updateCategory('company-1', 'invalid', 'user-1', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('removeCategory deve desativar e auditar', async () => {
      prisma.financialCategory.findFirst.mockResolvedValue(mockCategory);
      await service.removeCategory('company-1', 'cat-1', 'user-1');
      expect(prisma.financialCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat-1' },
          data: { active: false },
        }),
      );
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE' }),
      );
    });

    it('removeCategory deve lançar NotFoundException', async () => {
      prisma.financialCategory.findFirst.mockResolvedValue(null);
      await expect(
        service.removeCategory('company-1', 'invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Accounts', () => {
    it('findAccounts deve retornar lista paginada', async () => {
      prisma.$transaction.mockResolvedValue([[mockAccount], 1]);
      const result = await service.findAccounts('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('findAccounts deve filtrar por tipo e status', async () => {
      prisma.$transaction.mockResolvedValue([[mockAccount], 1]);
      await service.findAccounts('company-1', {
        type: 'PAYABLE',
        status: 'OPEN',
      });
      expect(prisma.financialAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'PAYABLE', status: 'OPEN' }),
        }),
      );
    });

    it('findAccount deve retornar conta', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue(mockAccount);
      const result = await service.findAccount('company-1', 'acc-1');
      expect(result.description).toBe('Aluguel do mês');
    });

    it('findAccount deve lançar NotFoundException', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue(null);
      await expect(
        service.findAccount('company-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('createAccount deve criar conta', async () => {
      prisma.financialCategory.findFirst.mockResolvedValue(mockCategory);
      const result = await service.createAccount('company-1', 'user-1', {
        categoryId: 'cat-1',
        description: 'Aluguel',
        type: 'PAYABLE',
        amount: 1500,
        dueDate: '2026-08-15',
      });
      expect(result.description).toBe('Aluguel do mês');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'FinancialAccount' }),
      );
    });

    it('createAccount deve lançar NotFoundException quando categoria não existe', async () => {
      prisma.financialCategory.findFirst.mockResolvedValue(null);
      await expect(
        service.createAccount('company-1', 'user-1', {
          categoryId: 'invalid',
          description: 'Teste',
          type: 'PAYABLE',
          amount: 100,
          dueDate: '2026-08-15',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updateAccount deve atualizar e auditar', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue(mockAccount);
      const result = await service.updateAccount('company-1', 'acc-1', 'user-1', {
        description: 'Aluguel atualizado',
      });
      expect(result).toBeDefined();
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });
  });

  describe('payAccount', () => {
    it('deve pagar conta', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue(mockAccount);
      const result = await service.payAccount('company-1', 'acc-1', 'user-1');
      expect(prisma.financialAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'acc-1' },
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PAY' }),
      );
    });

    it('deve lançar BadRequestException quando já paga', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue({
        ...mockAccount,
        status: 'PAID',
      });
      await expect(
        service.payAccount('company-1', 'acc-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando cancelada', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue({
        ...mockAccount,
        status: 'CANCELLED',
      });
      await expect(
        service.payAccount('company-1', 'acc-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelAccount', () => {
    it('deve cancelar conta', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue(mockAccount);
      const result = await service.cancelAccount('company-1', 'acc-1', 'user-1');
      expect(prisma.financialAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'acc-1' },
          data: { status: 'CANCELLED' },
        }),
      );
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CANCEL' }),
      );
    });

    it('deve lançar BadRequestException quando já paga', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue({
        ...mockAccount,
        status: 'PAID',
      });
      await expect(
        service.cancelAccount('company-1', 'acc-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando já cancelada', async () => {
      prisma.financialAccount.findFirst.mockResolvedValue({
        ...mockAccount,
        status: 'CANCELLED',
      });
      await expect(
        service.cancelAccount('company-1', 'acc-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCashFlow', () => {
    it('deve calcular fluxo de caixa', async () => {
      prisma.financialAccount.findMany.mockResolvedValue([
        { type: 'RECEIVABLE', status: 'PAID', amount: 1000 },
        { type: 'RECEIVABLE', status: 'OPEN', amount: 500 },
        { type: 'PAYABLE', status: 'PAID', amount: 300 },
        { type: 'PAYABLE', status: 'OPEN', amount: 200 },
      ]);
      const result = await service.getCashFlow('company-1');
      expect(result.income.total).toBe(1500);
      expect(result.income.paid).toBe(1000);
      expect(result.expense.total).toBe(500);
      expect(result.expense.paid).toBe(300);
      expect(result.balance.expected).toBe(1000);
      expect(result.balance.realized).toBe(700);
    });
  });

  describe('createCashClosing', () => {
    it('deve criar fechamento e fechar caixa', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(mockRegister);
      const result = await service.createCashClosing('company-1', 'user-1', {
        cashRegisterId: 'reg-1',
      });
      expect(result).toBeDefined();
      expect(prisma.cashRegister.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reg-1' },
          data: expect.objectContaining({ status: 'CLOSED' }),
        }),
      );
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CLOSE_CASH' }),
      );
    });

    it('deve lançar NotFoundException quando caixa não existe', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);
      await expect(
        service.createCashClosing('company-1', 'user-1', {
          cashRegisterId: 'invalid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando caixa já fechado', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({
        ...mockRegister,
        status: 'CLOSED',
      });
      await expect(
        service.createCashClosing('company-1', 'user-1', {
          cashRegisterId: 'reg-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findCashClosings', () => {
    it('deve retornar fechamentos', async () => {
      const result = await service.findCashClosings('company-1');
      expect(result).toHaveLength(1);
    });

    it('deve filtrar por unidade', async () => {
      await service.findCashClosings('company-1', 'unit-1');
      expect(prisma.cashClosing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unitId: 'unit-1' }),
        }),
      );
    });
  });
});

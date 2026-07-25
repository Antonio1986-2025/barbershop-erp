import { Test, TestingModule } from '@nestjs/testing';
import { SalePaymentService } from '../../../src/modules/sale/sale-payment.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { StockMovementService } from '../../../src/modules/stock/stock-movement.service';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { FinancialService } from '../../../src/modules/financial/financial.service';
import { CashbackService } from '../../../src/modules/cashback/cashback.service';
import { LoyaltyService } from '../../../src/modules/loyalty/loyalty.service';
import { AutomationService } from '../../../src/modules/automation/automation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SalePaymentService', () => {
  let service: SalePaymentService;
  let prisma: any;
  let auditService: any;
  let stockMovementService: any;

  const mockPayment = {
    id: 'pay-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    saleId: 'sale-1',
    serviceOrderId: null,
    amount: 50,
    paymentMethod: 'CASH',
    status: 'PAID',
    paidAt: new Date(),
    refundedAt: null,
    gatewayTransactionId: null,
    gatewayResponse: null,
  };

  const mockSale = {
    id: 'sale-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    status: 'OPEN',
    subtotal: 100,
    discountAmount: 0,
    total: 100,
    payments: [],
    customerId: 'cust-1',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Shampoo',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      payment: {
        findMany: jest.fn().mockResolvedValue([mockPayment]),
        findFirst: jest.fn().mockResolvedValue(mockPayment),
        create: jest.fn().mockResolvedValue(mockPayment),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ ...mockPayment, ...data }),
        ),
      },
      sale: {
        findFirst: jest.fn().mockResolvedValue(mockSale),
        findUnique: jest.fn().mockResolvedValue(mockSale),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ ...mockSale, ...data }),
        ),
      },
      stock: {
        findUnique: jest.fn().mockResolvedValue({ quantity: 100 }),
      },
      financialCategory: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Vendas', type: 'INCOME' }),
        create: jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Vendas' }),
      },
      cashRegister: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      cashTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'ct-1' }),
      },
    };

    auditService = { create: jest.fn() };
    stockMovementService = {
      recordMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
    };
    const notificationsService = { create: jest.fn() };
    const financialService = {
      createAccount: jest.fn().mockResolvedValue({ id: 'fa-1' }),
      cancelAccount: jest.fn().mockResolvedValue({ id: 'fa-1' }),
    };
    const cashbackService = { generate: jest.fn() };
    const loyaltyService = { earn: jest.fn() };
    const automationService = { onSalePaid: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalePaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: StockMovementService, useValue: stockMovementService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: FinancialService, useValue: financialService },
        { provide: CashbackService, useValue: cashbackService },
        { provide: LoyaltyService, useValue: loyaltyService },
        { provide: AutomationService, useValue: automationService },
      ],
    }).compile();

    service = module.get<SalePaymentService>(SalePaymentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve registrar pagamento e manter venda OPEN se parcial', async () => {
      prisma.sale.findFirst.mockResolvedValue({
        ...mockSale,
        total: 200,
        payments: [],
      });
      prisma.cashRegister.findFirst.mockResolvedValueOnce({ id: 'cr-1', status: 'OPEN' });

      const dto = { amount: 50, paymentMethod: 'CASH' };
      const result = await service.create('company-1', 'sale-1', 'user-1', dto);
      expect(result.status).toBe('PAID');
      expect(prisma.sale.update).not.toHaveBeenCalled();
    });

    it('deve mudar venda para PAID quando quitar total', async () => {
      prisma.sale.findFirst.mockResolvedValue({
        ...mockSale,
        total: 50,
        payments: [],
        items: mockSale.items,
      });

      const dto = { amount: 50, paymentMethod: 'PIX' };
      await service.create('company-1', 'sale-1', 'user-1', dto);
      expect(prisma.sale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sale-1' },
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });

    it('deve rejeitar pagamento que excede saldo restante', async () => {
      prisma.sale.findFirst.mockResolvedValue({
        ...mockSale,
        total: 30,
        payments: [],
      });

      const dto = { amount: 50, paymentMethod: 'CASH' };
      await expect(
        service.create('company-1', 'sale-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar pagamento em venda sem status OPEN/DRAFT', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'PAID' });
      const dto = { amount: 50, paymentMethod: 'CASH' };
      await expect(
        service.create('company-1', 'sale-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve registrar auditoria', async () => {
      prisma.sale.findFirst.mockResolvedValue({
        ...mockSale,
        total: 100,
        payments: [],
      });

      const dto = { amount: 50, paymentMethod: 'CREDIT_CARD' };
      await service.create('company-1', 'sale-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'payment' }),
      );
    });
  });

  describe('findBySale', () => {
    it('deve listar pagamentos da venda', async () => {
      const result = await service.findBySale('company-1', 'sale-1');
      expect(result).toHaveLength(1);
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { saleId: 'sale-1', companyId: 'company-1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar pagamento', async () => {
      const result = await service.findOne('company-1', 'pay-1');
      expect(result.id).toBe('pay-1');
    });

    it('deve lancar NotFoundException', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('deve cancelar pagamento', async () => {
      prisma.sale.findUnique.mockResolvedValue({
        ...mockSale,
        payments: [mockPayment],
      });

      const result = await service.cancel('company-1', 'pay-1', 'user-1');
      expect(result.status).toBe('CANCELED');
    });

    it('deve rejeitar cancelamento se ja cancelado', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: 'CANCELED',
      });
      await expect(
        service.cancel('company-1', 'pay-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refund', () => {
    it('deve reembolsar pagamento', async () => {
      prisma.sale.findUnique.mockResolvedValue({
        ...mockSale,
        payments: [mockPayment],
      });

      const result = await service.refund('company-1', 'pay-1', 'user-1');
      expect(result.status).toBe('REFUNDED');
      expect(result.refundedAt).toBeDefined();
    });

    it('deve rejeitar reembolso se ja reembolsado', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
      });
      await expect(
        service.refund('company-1', 'pay-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar reembolso de pagamento cancelado', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: 'CANCELED',
      });
      await expect(
        service.refund('company-1', 'pay-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('múltiplos pagamentos', () => {
    it('deve aceitar pagamentos parciais ate quitar', async () => {
      prisma.sale.findFirst.mockResolvedValue({
        ...mockSale,
        total: 100,
        payments: [{ ...mockPayment, amount: 30, status: 'PAID' }],
        items: mockSale.items,
      });

      const dto = { amount: 70, paymentMethod: 'PIX' };
      await service.create('company-1', 'sale-1', 'user-1', dto);
      expect(prisma.sale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });
  });
});

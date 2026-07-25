import { Test, TestingModule } from '@nestjs/testing';
import { SaleService } from '../../../src/modules/sale/sale.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { StockMovementService } from '../../../src/modules/stock/stock-movement.service';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { FinancialService } from '../../../src/modules/financial/financial.service';
import { CashbackService } from '../../../src/modules/cashback/cashback.service';
import { LoyaltyService } from '../../../src/modules/loyalty/loyalty.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SaleService', () => {
  let service: SaleService;
  let prisma: any;
  let auditService: any;
  let stockMovementService: any;

  const mockProduct = {
    id: 'prod-1',
    name: 'Shampoo',
    barcode: '123456',
    costPrice: 10,
    salePrice: 25,
  };

  const mockSale = {
    id: 'sale-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    customerId: null,
    status: 'DRAFT',
    subtotal: 50,
    discountAmount: 0,
    total: 50,
    notes: null,
    createdBy: 'user-1',
    updatedBy: null,
    cancelledBy: null,
    refundedBy: null,
    cancelledAt: null,
    cancelledReason: null,
    refundedAt: null,
    refundReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    unit: { id: 'unit-1', name: 'Matriz' },
    customer: null,
    items: [
      {
        id: 'item-1',
        saleId: 'sale-1',
        productId: 'prod-1',
        serviceId: null,
        productName: 'Shampoo',
        productBarcode: '123456',
        serviceName: null,
        quantity: 2,
        unitPrice: 25,
        costPrice: 10,
        totalPrice: 50,
        discountAmount: 0,
        createdAt: new Date(),
        product: { id: 'prod-1', name: 'Shampoo' },
        service: null,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      sale: {
        findMany: jest.fn().mockResolvedValue([mockSale]),
        findFirst: jest.fn().mockResolvedValue(mockSale),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockSale),
        update: jest.fn().mockResolvedValue(mockSale),
        delete: jest.fn().mockResolvedValue(mockSale),
      },
      saleItem: {
        findMany: jest.fn().mockResolvedValue(mockSale.items),
        findFirst: jest.fn().mockResolvedValue(mockSale.items[0]),
        create: jest.fn().mockResolvedValue(mockSale.items[0]),
        update: jest.fn().mockResolvedValue(mockSale.items[0]),
        delete: jest.fn().mockResolvedValue(mockSale.items[0]),
      },
      product: {
        findFirst: jest.fn().mockResolvedValue(mockProduct),
        findMany: jest.fn().mockResolvedValue([mockProduct]),
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
    const cashbackService = { cancelBySale: jest.fn() };
    const loyaltyService = { cancelBySale: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: StockMovementService, useValue: stockMovementService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: FinancialService, useValue: financialService },
        { provide: CashbackService, useValue: cashbackService },
        { provide: LoyaltyService, useValue: loyaltyService },
      ],
    }).compile();

    service = module.get<SaleService>(SaleService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('deve aplicar filtros', async () => {
      await service.findAll('company-1', { status: 'DRAFT', customerId: 'cust-1' });
      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-1',
            status: 'DRAFT',
            customerId: 'cust-1',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar venda', async () => {
      const result = await service.findOne('company-1', 'sale-1');
      expect(result.id).toBe('sale-1');
    });

    it('deve lancar NotFoundException', async () => {
      prisma.sale.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve criar venda com itens', async () => {
      const dto = {
        unitId: 'unit-1',
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 25 }],
      };
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.id).toBe('sale-1');
      expect(prisma.sale.create).toHaveBeenCalled();
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'sale' }),
      );
    });

    it('deve rejeitar venda sem itens', async () => {
      const dto = { unitId: 'unit-1', items: [] };
      await expect(service.create('company-1', 'user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar venda em DRAFT', async () => {
      const dto = { notes: 'Observação' };
      const result = await service.update('company-1', 'sale-1', 'user-1', dto);
      expect(result.id).toBe('sale-1');
    });

    it('deve rejeitar edicao se nao for DRAFT', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'OPEN' });
      const dto = { notes: 'teste' };
      await expect(
        service.update('company-1', 'sale-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('open', () => {
    it('deve abrir venda em DRAFT com itens', async () => {
      prisma.sale.update.mockResolvedValue({ ...mockSale, status: 'OPEN' });
      const result = await service.open('company-1', 'sale-1', 'user-1');
      expect(result.status).toBe('OPEN');
    });

    it('deve rejeitar se venda nao for DRAFT', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'PAID' });
      await expect(service.open('company-1', 'sale-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar se venda nao tem itens', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, items: [] });
      await expect(service.open('company-1', 'sale-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('deve cancelar venda', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'OPEN' });
      prisma.sale.update.mockResolvedValue({ ...mockSale, status: 'CANCELLED' });
      const result = await service.cancel('company-1', 'sale-1', 'user-1', 'Desistência');
      expect(result.status).toBe('CANCELLED');
    });

    it('deve rejeitar cancelamento se ja cancelada', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'CANCELLED' });
      await expect(service.cancel('company-1', 'sale-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover venda em DRAFT', async () => {
      const result = await service.remove('company-1', 'sale-1', 'user-1');
      expect(result.message).toBe('Venda removida');
      expect(prisma.sale.delete).toHaveBeenCalled();
    });

    it('deve rejeitar remocao se nao for DRAFT', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'OPEN' });
      await expect(service.remove('company-1', 'sale-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addItem', () => {
    it('deve adicionar item em venda DRAFT', async () => {
      const dto = { productId: 'prod-1', quantity: 1, unitPrice: 25 };
      const result = await service.addItem('company-1', 'sale-1', 'user-1', dto);
      expect(result.productId).toBe('prod-1');
    });

    it('deve rejeitar item se venda nao for DRAFT', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'OPEN' });
      const dto = { productId: 'prod-1', quantity: 1, unitPrice: 25 };
      await expect(
        service.addItem('company-1', 'sale-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateItem', () => {
    it('deve alterar quantidade do item', async () => {
      const dto = { quantity: 3 };
      const result = await service.updateItem('company-1', 'sale-1', 'item-1', 'user-1', dto);
      expect(result.productId).toBe('prod-1');
    });

    it('deve rejeitar alteracao se venda nao for DRAFT', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'PAID' });
      const dto = { quantity: 3 };
      await expect(
        service.updateItem('company-1', 'sale-1', 'item-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('deve remover item da venda', async () => {
      const result = await service.removeItem('company-1', 'sale-1', 'item-1', 'user-1');
      expect(result.message).toBe('Item removido');
    });

    it('deve rejeitar remocao se venda nao for DRAFT', async () => {
      prisma.sale.findFirst.mockResolvedValue({ ...mockSale, status: 'OPEN' });
      await expect(
        service.removeItem('company-1', 'sale-1', 'item-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recálculo de totais', () => {
    it('deve recalcular totais apos adicionar item', async () => {
      prisma.saleItem.findMany.mockResolvedValue([
        { ...mockSale.items[0], totalPrice: 50, discountAmount: 0 },
        { ...mockSale.items[0], id: 'item-2', totalPrice: 30, discountAmount: 0 },
      ]);

      const dto = { productId: 'prod-1', quantity: 1, unitPrice: 30 };
      await service.addItem('company-1', 'sale-1', 'user-1', dto);

      expect(prisma.sale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sale-1' },
          data: expect.objectContaining({
            subtotal: 80,
            total: 80,
          }),
        }),
      );
    });
  });
});

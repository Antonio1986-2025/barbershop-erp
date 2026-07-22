import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseService } from '../../../src/modules/stock/purchase.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockMovementService } from '../../../src/modules/stock/stock-movement.service';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let prisma: any;
  let auditService: any;
  let stockMovementService: any;

  const mockProduct = { id: 'prod-1', name: 'Shampoo', companyId: 'company-1' };
  const mockItem = {
    id: 'item-1',
    purchaseId: 'purchase-1',
    productId: 'prod-1',
    quantity: 10,
    unitCost: 15.5,
    totalCost: 155,
    product: { id: 'prod-1', name: 'Shampoo' },
  };
  const mockPurchase = {
    id: 'purchase-1',
    companyId: 'company-1',
    supplierId: 'supplier-1',
    unitId: 'unit-1',
    status: 'DRAFT',
    totalAmount: 0,
    invoiceNumber: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [mockItem],
    supplier: { id: 'supplier-1', name: 'Distribuidora ABC' },
    unit: { id: 'unit-1', name: 'Matriz' },
  };

  beforeEach(async () => {
    stockMovementService = {
      recordMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
    };

    prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([mockProduct]),
        findFirst: jest.fn().mockResolvedValue(mockProduct),
      },
      purchase: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockPurchase]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockPurchase),
        update: jest
          .fn()
          .mockImplementation((args) => ({ ...mockPurchase, ...args.data })),
      },
      purchaseItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue(mockItem),
        delete: jest.fn().mockResolvedValue(mockItem),
      },
    };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: StockMovementService, useValue: stockMovementService },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve filtrar por status', async () => {
      await service.findAll('company-1', { status: 'DRAFT' });
      expect(prisma.purchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DRAFT' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar compra com includes', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      const result = await service.findOne('company-1', 'purchase-1');
      expect(result.id).toBe('purchase-1');
    });

    it('deve lançar NotFoundException', async () => {
      prisma.purchase.findFirst.mockResolvedValue(null);
      await expect(
        service.findOne('company-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      supplierId: 'supplier-1',
      unitId: 'unit-1',
      items: [{ productId: 'prod-1', quantity: 10, unitCost: 15.5 }],
    };

    it('deve criar compra com itens', async () => {
      const result = await service.create('company-1', 'user-1', dto);
      expect(result).toBeDefined();
    });

    it('deve rejeitar compra sem itens', async () => {
      await expect(
        service.create('company-1', 'user-1', { ...dto, items: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve validar produtos existentes', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await expect(
        service.create('company-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve registrar auditoria', async () => {
      await service.create('company-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'purchase' }),
      );
    });
  });

  describe('confirm', () => {
    it('deve confirmar compra em draft', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      const result = await service.confirm('company-1', 'purchase-1', 'user-1');
      expect(result.status).toBe('CONFIRMED');
    });

    it('deve criar movimentacoes de estoque ao confirmar', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      await service.confirm('company-1', 'purchase-1', 'user-1');
      expect(stockMovementService.recordMovement).toHaveBeenCalledTimes(1);
      expect(stockMovementService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-1',
          productId: 'prod-1',
          type: 'PURCHASE',
          quantity: 10,
          referenceType: 'purchase',
        }),
      );
    });

    it('deve rejeitar confirmacao se ja confirmada', async () => {
      prisma.purchase.findFirst.mockResolvedValue({
        ...mockPurchase,
        status: 'CONFIRMED',
      });
      await expect(
        service.confirm('company-1', 'purchase-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar confirmacao se cancelada', async () => {
      prisma.purchase.findFirst.mockResolvedValue({
        ...mockPurchase,
        status: 'CANCELLED',
      });
      await expect(
        service.confirm('company-1', 'purchase-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve registrar auditoria', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      await service.confirm('company-1', 'purchase-1', 'user-1');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });
  });

  describe('cancel', () => {
    it('deve cancelar compra em draft', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      const result = await service.cancel('company-1', 'purchase-1', 'user-1');
      expect(result.status).toBe('CANCELLED');
    });

    it('deve rejeitar cancelamento se ja cancelada', async () => {
      prisma.purchase.findFirst.mockResolvedValue({
        ...mockPurchase,
        status: 'CANCELLED',
      });
      await expect(
        service.cancel('company-1', 'purchase-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar cancelamento se confirmada', async () => {
      prisma.purchase.findFirst.mockResolvedValue({
        ...mockPurchase,
        status: 'CONFIRMED',
      });
      await expect(
        service.cancel('company-1', 'purchase-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addItem', () => {
    const dto = { productId: 'prod-1', quantity: 5, unitCost: 12 };

    it('deve adicionar item em compra draft', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      prisma.purchaseItem.findMany.mockResolvedValue([mockItem, { ...mockItem, id: 'item-2', totalCost: 60 }]);
      const result = await service.addItem('company-1', 'purchase-1', 'user-1', dto);
      expect(result.productId).toBe('prod-1');
    });

    it('deve rejeitar se compra nao for draft', async () => {
      prisma.purchase.findFirst.mockResolvedValue({
        ...mockPurchase,
        status: 'CONFIRMED',
      });
      await expect(
        service.addItem('company-1', 'purchase-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar se produto nao pertencer a empresa', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.addItem('company-1', 'purchase-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('deve remover item de compra draft', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      prisma.purchaseItem.findFirst.mockResolvedValue(mockItem);
      prisma.purchaseItem.findMany.mockResolvedValue([]);
      const result = await service.removeItem(
        'company-1',
        'purchase-1',
        'item-1',
        'user-1',
      );
      expect(result.message).toBe('Item removido');
    });

    it('deve rejeitar se compra nao for draft', async () => {
      prisma.purchase.findFirst.mockResolvedValue({
        ...mockPurchase,
        status: 'CONFIRMED',
      });
      await expect(
        service.removeItem('company-1', 'purchase-1', 'item-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar se item nao existir', async () => {
      prisma.purchase.findFirst.mockResolvedValue(mockPurchase);
      prisma.purchaseItem.findFirst.mockResolvedValue(null);
      await expect(
        service.removeItem('company-1', 'purchase-1', 'invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

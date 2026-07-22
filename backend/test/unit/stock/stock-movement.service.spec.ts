import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementService } from '../../../src/modules/stock/stock-movement.service';
import { StockAlertService } from '../../../src/modules/stock/stock-alert.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';

describe('StockMovementService', () => {
  let service: StockMovementService;
  let prisma: any;
  let auditService: any;

  const mockMovement = {
    id: 'mov-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    productId: 'prod-1',
    type: StockMovementType.PURCHASE,
    quantity: 10,
    unitCost: 15.5,
    totalCost: 155,
    balanceBefore: 0,
    balanceAfter: 10,
    avgCostBefore: 0,
    avgCostAfter: 15.5,
    referenceId: 'purchase-1',
    referenceType: 'purchase',
    description: 'Compra',
    createdBy: 'user-1',
    createdAt: new Date(),
    product: { id: 'prod-1', name: 'Shampoo' },
    unit: { id: 'unit-1', name: 'Matriz' },
  };

  const mockStock = {
    id: 'stock-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    productId: 'prod-1',
    quantity: 10,
    avgCost: 15.5,
    createdBy: 'user-1',
    updatedBy: null,
    unit: { id: 'unit-1', name: 'Matriz' },
    product: { id: 'prod-1', name: 'Shampoo', barcode: '123', salePrice: 50, costPrice: 20 },
  };

  beforeEach(async () => {
    prisma = {
      stock: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(mockStock),
        findMany: jest.fn().mockResolvedValue([mockStock]),
      },
      stockMovement: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockMovement]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockImplementation((args) => ({
          ...mockMovement,
          ...args.data,
          id: 'mov-' + Date.now(),
          product: { id: args.data.productId, name: 'Shampoo' },
          unit: { id: args.data.unitId, name: 'Matriz' },
        })),
      },
      product: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'prod-1',
          name: 'Shampoo',
          barcode: '123',
          salePrice: 50,
          costPrice: 20,
        }),
      },
    };

    auditService = { create: jest.fn() };
    const stockAlertService = {
      checkAfterMovement: jest.fn(),
      resolveByCondition: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: StockAlertService, useValue: stockAlertService },
      ],
    }).compile();

    service = module.get<StockMovementService>(StockMovementService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('recordMovement', () => {
    const params = {
      companyId: 'company-1',
      unitId: 'unit-1',
      productId: 'prod-1',
      type: StockMovementType.PURCHASE,
      quantity: 10,
      unitCost: 15.5,
      totalCost: 155,
      referenceId: 'purchase-1',
      referenceType: 'purchase',
      description: 'Compra teste',
      userId: 'user-1',
    };

    it('deve criar movimentacao de entrada', async () => {
      const result = await service.recordMovement(params);
      expect(result.type).toBe(StockMovementType.PURCHASE);
      expect(result.balanceAfter).toBe(10);
    });

    it('deve calcular saldo a partir do estoque atual', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        ...mockStock,
        quantity: 5,
        avgCost: 10,
      });

      const result = await service.recordMovement(params);
      expect(result.balanceBefore).toBe(5);
      expect(result.balanceAfter).toBe(15);
    });

    it('deve calcular custo medio em entrada', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        ...mockStock,
        quantity: 5,
        avgCost: 10,
      });

      const result = await service.recordMovement(params);
      const expectedAvgCost = (10 * 5 + 15.5 * 10) / (5 + 10);
      expect(result.avgCostAfter).toBeCloseTo(expectedAvgCost);
    });

    it('deve lancar erro para estoque negativo', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        ...mockStock,
        quantity: 3,
      });

      await expect(
        service.recordMovement({
          ...params,
          type: StockMovementType.SALE,
          quantity: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve permitir saida se saldo suficiente', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        ...mockStock,
        quantity: 20,
        avgCost: 10,
      });

      const saleMovement = { ...mockMovement, type: StockMovementType.SALE, quantity: 10, balanceAfter: 10 };
      prisma.stockMovement.create.mockResolvedValue(saleMovement);

      const result = await service.recordMovement({
        ...params,
        type: StockMovementType.SALE,
        quantity: 10,
      });
      expect(result.balanceAfter).toBe(10);
    });

    it('deve ignorar check negativo com skipNegativeCheck', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        ...mockStock,
        quantity: 0,
      });

      const result = await service.recordMovement({
        ...params,
        type: StockMovementType.SALE,
        quantity: 10,
        skipNegativeCheck: true,
      });
      expect(result.balanceAfter).toBe(-10);
    });

    it('deve upsert no estoque', async () => {
      await service.recordMovement(params);
      expect(prisma.stock.upsert).toHaveBeenCalled();
    });

    it('deve registrar auditoria', async () => {
      await service.recordMovement(params);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'stock_movement' }),
      );
    });

    it('nao deve calcular custo medio em saida', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        ...mockStock,
        quantity: 20,
        avgCost: 10,
      });

      const saleMovement = {
        ...mockMovement,
        type: StockMovementType.SALE,
        quantity: 10,
        avgCostBefore: null,
        avgCostAfter: null,
      };
      prisma.stockMovement.create.mockResolvedValue(saleMovement);

      const result = await service.recordMovement({
        ...params,
        type: StockMovementType.SALE,
        quantity: 5,
      });
      expect(result.avgCostBefore).toBeNull();
      expect(result.avgCostAfter).toBeNull();
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve filtrar por productId', async () => {
      await service.findAll('company-1', { productId: 'prod-1' });
      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'prod-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar movimentacao', async () => {
      prisma.stockMovement.findFirst.mockResolvedValue(mockMovement);
      const result = await service.findOne('company-1', 'mov-1');
      expect(result.id).toBe('mov-1');
    });

    it('deve lancar NotFoundException', async () => {
      prisma.stockMovement.findFirst.mockResolvedValue(null);
      await expect(
        service.findOne('company-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProductStock', () => {
    it('deve retornar estoque do produto', async () => {
      const result = await service.getProductStock('company-1', 'prod-1');
      expect(result.product.id).toBe('prod-1');
      expect(result.stocks).toHaveLength(1);
    });

    it('deve retornar estoque zerado se sem registro', async () => {
      prisma.stock.findMany.mockResolvedValue([]);
      const result = await service.getProductStock('company-1', 'prod-1');
      expect(result.stocks).toHaveLength(0);
      expect(result.totalQuantity).toBe(0);
    });

    it('deve lancar NotFoundException se produto nao existe', async () => {
      prisma.stock.findMany.mockResolvedValue([]);
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.getProductStock('company-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adjust', () => {
    const dto = {
      unitId: 'unit-1',
      productId: 'prod-1',
      quantity: 5,
      unitCost: 20,
      description: 'Ajuste manual',
    };

    it('deve criar ajuste positivo', async () => {
      const result = await service.adjust('company-1', dto, 'user-1');
      expect(result.type).toBe(StockMovementType.ADJUSTMENT);
    });

    it('deve criar ajuste negativo', async () => {
      prisma.stock.findUnique.mockResolvedValue({ ...mockStock, quantity: 10 });

      const negativeMovement = {
        ...mockMovement,
        type: StockMovementType.ADJUSTMENT,
        quantity: 3,
        balanceBefore: 10,
        balanceAfter: 7,
      };
      prisma.stockMovement.create.mockResolvedValue(negativeMovement);

      const result = await service.adjust(
        'company-1',
        { ...dto, quantity: -3 },
        'user-1',
      );
      expect(result.balanceAfter).toBe(7);
    });

    it('deve rejeitar quantidade zero', async () => {
      await expect(
        service.adjust('company-1', { ...dto, quantity: 0 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

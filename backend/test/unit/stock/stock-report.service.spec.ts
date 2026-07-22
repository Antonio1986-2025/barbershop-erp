import { Test, TestingModule } from '@nestjs/testing';
import { StockReportService } from '../../../src/modules/stock/stock-report.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('StockReportService', () => {
  let service: StockReportService;
  let prisma: any;

  const mockStocks = [
    {
      productId: 'prod-1',
      unitId: 'unit-1',
      quantity: 50,
      avgCost: 20,
      unit: { id: 'unit-1', name: 'Matriz' },
      product: { id: 'prod-1', name: 'Shampoo', barcode: '123', salePrice: 50, costPrice: 20 },
    },
    {
      productId: 'prod-2',
      unitId: 'unit-1',
      quantity: 30,
      avgCost: 15,
      unit: { id: 'unit-1', name: 'Matriz' },
      product: { id: 'prod-2', name: 'Condicionador', barcode: '456', salePrice: 40, costPrice: 15 },
    },
  ];

  const mockMovements = [
    {
      id: 'mov-1',
      createdAt: new Date(),
      type: 'PURCHASE',
      productId: 'prod-1',
      quantity: 10,
      unitCost: 20,
      totalCost: 200,
      balanceBefore: 40,
      balanceAfter: 50,
      avgCostBefore: 19,
      avgCostAfter: 20,
      referenceType: 'purchase',
      referenceId: 'purchase-1',
      description: 'Compra',
      product: { id: 'prod-1', name: 'Shampoo', barcode: '123' },
      unit: { id: 'unit-1', name: 'Matriz' },
    },
  ];

  beforeEach(async () => {
    prisma = {
      stock: {
        findMany: jest.fn().mockResolvedValue(mockStocks),
      },
      stockMovement: {
        findMany: jest.fn().mockResolvedValue(mockMovements),
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn(),
      },
      product: {
        findFirst: jest.fn().mockResolvedValue(mockStocks[0].product),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockReportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StockReportService>(StockReportService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('currentStock', () => {
    it('deve retornar posicao atual', async () => {
      const result = await service.currentStock('company-1', {});
      expect(result.data).toHaveLength(2);
      expect(result.totalValue).toBe(50 * 20 + 30 * 15);
    });

    it('deve filtrar por unitId', async () => {
      await service.currentStock('company-1', { unitId: 'unit-1' });
      expect(prisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unitId: 'unit-1' }),
        }),
      );
    });
  });

  describe('movements', () => {
    it('deve retornar movimentacoes paginadas', async () => {
      const result = await service.movements('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('kardex', () => {
    it('deve retornar kardex do produto', async () => {
      const result = await service.kardex('company-1', 'prod-1', {});
      expect(result.product).toBeDefined();
      expect(result.product.name).toBe('Shampoo');
    });

    it('deve retornar product null se nao encontrado', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      const result = await service.kardex('company-1', 'invalid', {});
      expect(result.product).toBeNull();
    });
  });

  describe('turnover', () => {
    it('deve calcular giro de estoque', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([
        { productId: 'prod-1', quantity: 10 },
      ]);
      const result = await service.turnover('company-1', {});
      expect(result.data).toHaveLength(2);
      expect(result.period).toBeDefined();
      expect(result.period.days).toBeGreaterThan(0);
    });
  });

  describe('valuation', () => {
    it('deve calcular valorizacao por unidade', async () => {
      const result = await service.valuation('company-1', {});
      expect(result.byUnit).toHaveLength(1);
      expect(result.grandTotal).toBeGreaterThan(0);
      expect(result.totalItems).toBe(2);
    });
  });

  describe('lowStock', () => {
    it('deve retornar produtos com estoque zero', async () => {
      prisma.stock.findMany.mockResolvedValue([mockStocks[0]]);
      const result = await service.lowStock('company-1', {});
      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar por unitId', async () => {
      await service.lowStock('company-1', { unitId: 'unit-1' });
      expect(prisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ quantity: 0, unitId: 'unit-1' }),
        }),
      );
    });
  });

  describe('inactiveProducts', () => {
    it('deve retornar produtos sem movimentacao', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      const result = await service.inactiveProducts('company-1', {});
      expect(result.data).toHaveLength(2);
    });

    it('deve excluir produtos com movimento', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([{ productId: 'prod-1' }]);
      const result = await service.inactiveProducts('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.data[0].productId).toBe('prod-2');
    });
  });
});

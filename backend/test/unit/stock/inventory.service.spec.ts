import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../../src/modules/stock/inventory.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { StockMovementService } from '../../../src/modules/stock/stock-movement.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;
  let auditService: any;
  let stockMovementService: any;

  const mockUnit = { id: 'unit-1', name: 'Matriz' };
  const mockProduct = { id: 'prod-1', name: 'Shampoo', barcode: '123' };
  const mockProduct2 = { id: 'prod-2', name: 'Condicionador', barcode: '456' };

  const mockItem = {
    id: 'item-1',
    inventoryId: 'inv-1',
    productId: 'prod-1',
    systemQuantity: 10,
    countedQuantity: 12,
    difference: 2,
    unitCost: 15.5,
    notes: null,
    product: mockProduct,
  };

  const mockInventory = {
    id: 'inv-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    status: 'OPEN',
    notes: null,
    createdBy: 'user-1',
    startedBy: null,
    reviewedBy: null,
    approvedBy: null,
    cancelledBy: null,
    createdAt: new Date(),
    startedAt: null,
    reviewedAt: null,
    approvedAt: null,
    cancelledAt: null,
    unit: mockUnit,
    items: [mockItem],
    _count: { items: 1 },
  };

  beforeEach(async () => {
    prisma = {
      inventoryCount: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockInventory]),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockInventory),
        update: jest.fn().mockImplementation((args) => ({
          ...mockInventory,
          ...args.data,
          unit: mockUnit,
          items: [mockItem],
        })),
      },
      inventoryItem: {
        findMany: jest.fn().mockResolvedValue([mockItem]),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation((args) => ({
          ...mockItem,
          ...args.data,
          id: 'item-' + Date.now(),
          product: mockProduct,
        })),
        update: jest.fn().mockImplementation((args) => ({
          ...mockItem,
          ...args.data,
          product: mockProduct,
        })),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      unit: {
        findFirst: jest.fn().mockResolvedValue(mockUnit),
      },
      product: {
        findFirst: jest.fn().mockResolvedValue(mockProduct),
      },
      stock: {
        findMany: jest.fn().mockResolvedValue([
          { productId: 'prod-1', quantity: 10, avgCost: 15.5, product: mockProduct },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          quantity: 10,
          avgCost: 15.5,
        }),
      },
    };

    auditService = { create: jest.fn() };
    stockMovementService = {
      recordMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: StockMovementService, useValue: stockMovementService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar inventario com snapshot do estoque', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(null);
      prisma.inventoryCount.findUnique.mockResolvedValue({
        ...mockInventory,
        items: [mockItem, { ...mockItem, id: 'item-2', productId: 'prod-2', product: mockProduct2 }],
      });

      const result = await service.create('company-1', 'user-1', {
        unitId: 'unit-1',
      });
      expect(result.status).toBe('OPEN');
    });

    it('deve rejeitar se ja existe inventario aberto', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(mockInventory);
      await expect(
        service.create('company-1', 'user-1', { unitId: 'unit-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar unidade inexistente', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(null);
      prisma.unit.findFirst.mockResolvedValue(null);
      await expect(
        service.create('company-1', 'user-1', { unitId: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve registrar auditoria', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(null);
      prisma.inventoryCount.findUnique.mockResolvedValue(mockInventory);
      await service.create('company-1', 'user-1', { unitId: 'unit-1' });
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'inventory_count' }),
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar inventario com items', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(mockInventory);
      const result = await service.findOne('company-1', 'inv-1');
      expect(result.id).toBe('inv-1');
    });

    it('deve lancar NotFoundException', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(null);
      await expect(
        service.findOne('company-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addItem', () => {
    it('deve adicionar item durante contagem', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue({
        ...mockInventory,
        status: 'COUNTING',
      });
      const result = await service.addItem('company-1', 'inv-1', 'user-1', {
        productId: 'prod-1',
        countedQuantity: 15,
      });
      expect(result.productId).toBe('prod-1');
    });

    it('deve rejeitar se nao estiver em COUNTING', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(mockInventory);
      await expect(
        service.addItem('company-1', 'inv-1', 'user-1', {
          productId: 'prod-1',
          countedQuantity: 15,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve calcular diferenca corretamente', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue({
        ...mockInventory,
        status: 'COUNTING',
      });
      prisma.stock.findUnique.mockResolvedValue({
        quantity: 10,
        avgCost: 15.5,
      });
      const result = await service.addItem('company-1', 'inv-1', 'user-1', {
        productId: 'prod-1',
        countedQuantity: 15,
      });
      expect(Number(result.difference)).toBe(5);
    });
  });

  describe('updateItem', () => {
    it('deve atualizar item durante contagem', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue({
        ...mockInventory,
        status: 'COUNTING',
      });
      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);

      const result = await service.updateItem(
        'company-1', 'inv-1', 'item-1', 'user-1',
        { countedQuantity: 8 },
      );
      expect(result.productId).toBe('prod-1');
    });

    it('deve rejeitar se nao estiver em COUNTING', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(mockInventory);
      await expect(
        service.updateItem('company-1', 'inv-1', 'item-1', 'user-1', {
          countedQuantity: 8,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('workflow transitions', () => {
    it('deve iniciar contagem', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(mockInventory);
      const result = await service.start('company-1', 'inv-1', 'user-2');
      expect(result.status).toBe('COUNTING');
    });

    it('deve revisar', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue({
        ...mockInventory,
        status: 'COUNTING',
      });
      const result = await service.review('company-1', 'inv-1', 'user-3');
      expect(result.status).toBe('REVIEW');
    });

    it('deve aprovar e gerar ajustes', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue({
        ...mockInventory,
        status: 'REVIEW',
      });
      const result = await service.approve('company-1', 'inv-1', 'user-4');
      expect(result.status).toBe('CLOSED');
      expect(stockMovementService.recordMovement).toHaveBeenCalled();
      expect(stockMovementService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADJUSTMENT',
          referenceType: 'inventory',
          skipNegativeCheck: true,
        }),
      );
    });

    it('deve rejeitar transicao invalida', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue({
        ...mockInventory,
        status: 'CLOSED',
      });
      await expect(
        service.start('company-1', 'inv-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve registrar auditoria nas transicoes', async () => {
      prisma.inventoryCount.findFirst.mockResolvedValue(mockInventory);
      await service.start('company-1', 'inv-1', 'user-2');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entity: 'inventory_count' }),
      );
    });
  });
});

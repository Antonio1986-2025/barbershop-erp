import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from '../../../src/modules/stock/transfer.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { StockMovementService } from '../../../src/modules/stock/stock-movement.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransferService', () => {
  let service: TransferService;
  let prisma: any;
  let auditService: any;
  let stockMovementService: any;

  const mockProduct = { id: 'prod-1', name: 'Shampoo', companyId: 'company-1' };
  const mockUnit = { id: 'unit-1', name: 'Matriz', companyId: 'company-1' };
  const mockUnit2 = { id: 'unit-2', name: 'Filial', companyId: 'company-1' };

  const mockTransfer = {
    id: 'transfer-1',
    companyId: 'company-1',
    fromUnitId: 'unit-1',
    toUnitId: 'unit-2',
    productId: 'prod-1',
    quantity: 10,
    unitCost: 15.5,
    status: 'PENDING',
    notes: null,
    createdBy: 'user-1',
    approvedBy: null,
    sentBy: null,
    receivedBy: null,
    cancelledBy: null,
    createdAt: new Date(),
    approvedAt: null,
    sentAt: null,
    receivedAt: null,
    cancelledAt: null,
    updatedAt: new Date(),
    fromUnit: { id: 'unit-1', name: 'Matriz' },
    toUnit: { id: 'unit-2', name: 'Filial' },
    product: { id: 'prod-1', name: 'Shampoo', barcode: '123' },
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue(mockProduct),
      },
      unit: {
        findFirst: jest.fn().mockImplementation((args) => {
          if (args.where.id === 'unit-1') return Promise.resolve(mockUnit);
          if (args.where.id === 'unit-2') return Promise.resolve(mockUnit2);
          return Promise.resolve(null);
        }),
      },
      stock: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'stock-1',
          companyId: 'company-1',
          unitId: 'unit-1',
          productId: 'prod-1',
          quantity: 50,
          avgCost: 15.5,
        }),
      },
      transfer: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockTransfer]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockTransfer),
        update: jest.fn().mockImplementation((args) => ({
          ...mockTransfer,
          ...args.data,
          fromUnit: { id: 'unit-1', name: 'Matriz' },
          toUnit: { id: 'unit-2', name: 'Filial' },
          product: { id: 'prod-1', name: 'Shampoo', barcode: '123' },
        })),
      },
    };

    auditService = { create: jest.fn() };
    stockMovementService = {
      recordMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: StockMovementService, useValue: stockMovementService },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      fromUnitId: 'unit-1',
      toUnitId: 'unit-2',
      productId: 'prod-1',
      quantity: 10,
    };

    it('deve criar transferencia', async () => {
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.status).toBe('PENDING');
    });

    it('deve rejeitar mesma unidade', async () => {
      await expect(
        service.create('company-1', 'user-1', {
          ...dto,
          toUnitId: 'unit-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar produto inexistente', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.create('company-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar origem inexistente', async () => {
      prisma.unit.findFirst.mockImplementation((args) => {
        if (args.where.id === 'unit-2') return Promise.resolve(mockUnit2);
        return Promise.resolve(null);
      });
      await expect(
        service.create('company-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar saldo insuficiente', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        quantity: 5,
        avgCost: 15.5,
      });
      await expect(
        service.create('company-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve capturar custo medio do estoque', async () => {
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.unitCost).toBe(15.5);
    });

    it('deve registrar auditoria', async () => {
      await service.create('company-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'transfer' }),
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve filtrar por status', async () => {
      await service.findAll('company-1', { status: 'PENDING' });
      expect(prisma.transfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar transferencia', async () => {
      prisma.transfer.findFirst.mockResolvedValue(mockTransfer);
      const result = await service.findOne('company-1', 'transfer-1');
      expect(result.id).toBe('transfer-1');
    });

    it('deve lancar NotFoundException', async () => {
      prisma.transfer.findFirst.mockResolvedValue(null);
      await expect(
        service.findOne('company-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('workflow transitions', () => {
    beforeEach(() => {
      prisma.transfer.findFirst.mockResolvedValue(mockTransfer);
    });

    it('deve aprovar transferencia', async () => {
      const result = await service.approve('company-1', 'transfer-1', 'user-2');
      expect(result.status).toBe('APPROVED');
      expect(result.approvedBy).toBe('user-2');
      expect(auditService.create).toHaveBeenCalled();
    });

    it('deve enviar transferencia', async () => {
      prisma.transfer.findFirst.mockResolvedValue({
        ...mockTransfer,
        status: 'APPROVED',
      });
      const result = await service.send('company-1', 'transfer-1', 'user-3');
      expect(result.status).toBe('IN_TRANSIT');
    });

    it('deve receber transferencia e criar movimentacoes', async () => {
      prisma.transfer.findFirst.mockResolvedValue({
        ...mockTransfer,
        status: 'IN_TRANSIT',
      });
      prisma.transfer.update.mockResolvedValue({
        ...mockTransfer,
        status: 'RECEIVED',
        receivedBy: 'user-4',
      });

      const result = await service.receive('company-1', 'transfer-1', 'user-4');
      expect(result.status).toBe('RECEIVED');
      expect(stockMovementService.recordMovement).toHaveBeenCalledTimes(2);
      expect(stockMovementService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRANSFER_OUT', unitId: 'unit-1' }),
      );
      expect(stockMovementService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRANSFER_IN', unitId: 'unit-2' }),
      );
    });

    it('deve cancelar transferencia', async () => {
      const result = await service.cancel('company-1', 'transfer-1', 'user-5');
      expect(result.status).toBe('CANCELLED');
    });

    it('deve rejeitar transicao invalida', async () => {
      prisma.transfer.findFirst.mockResolvedValue({
        ...mockTransfer,
        status: 'COMPLETED',
      });
      await expect(
        service.approve('company-1', 'transfer-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar recebimento sem estar IN_TRANSIT', async () => {
      await expect(
        service.receive('company-1', 'transfer-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

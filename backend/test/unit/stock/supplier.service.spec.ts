import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from '../../../src/modules/stock/supplier.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('SupplierService', () => {
  let service: SupplierService;
  let prisma: any;
  let auditService: any;

  const mockSupplier = {
    id: 'supplier-1',
    companyId: 'company-1',
    name: 'Distribuidora ABC',
    document: '11222333444455',
    email: 'contato@abc.com',
    phone: '11999999999',
    contact: 'João',
    notes: 'Fornecedor de produtos capilares',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      supplier: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockSupplier]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockSupplier),
        update: jest
          .fn()
          .mockImplementation((args) => ({ ...mockSupplier, ...args.data })),
      },
    };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve filtrar por search', async () => {
      await service.findAll('company-1', { search: 'ABC' });
      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'ABC', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('deve excluir deletados', async () => {
      await service.findAll('company-1', {});
      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar fornecedor', async () => {
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);
      const result = await service.findOne('company-1', 'supplier-1');
      expect(result.name).toBe('Distribuidora ABC');
    });

    it('deve lançar NotFoundException', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Fornecedor Novo',
      document: '99888777766655',
      email: 'novo@email.com',
    };

    it('deve criar fornecedor', async () => {
      prisma.supplier.create.mockResolvedValue({ ...mockSupplier, name: 'Fornecedor Novo' });
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.name).toBe('Fornecedor Novo');
    });

    it('deve registrar auditoria', async () => {
      await service.create('company-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'supplier' }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar fornecedor', async () => {
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);
      prisma.supplier.update.mockResolvedValue({
        ...mockSupplier,
        name: 'Nome Atualizado',
      });
      const result = await service.update('company-1', 'supplier-1', 'user-1', {
        name: 'Nome Atualizado',
      });
      expect(result.name).toBe('Nome Atualizado');
    });

    it('deve lançar NotFoundException', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(
        service.update('company-1', 'invalid', 'user-1', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);
      await service.update('company-1', 'supplier-1', 'user-1', {
        name: 'Novo',
      });
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete', async () => {
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);
      const result = await service.remove('company-1', 'supplier-1', 'user-1');
      expect(result.active).toBe(false);
    });

    it('deve lançar NotFoundException', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(
        service.remove('company-1', 'invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);
      await service.remove('company-1', 'supplier-1', 'user-1');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE' }),
      );
    });
  });
});

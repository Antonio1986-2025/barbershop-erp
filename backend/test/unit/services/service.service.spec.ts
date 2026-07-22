import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from '../../../src/modules/service/service.service';
import { CacheService } from '../../../src/modules/cache/cache.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ServiceService', () => {
  let service: ServiceService;
  let prisma: any;
  let auditService: any;
  let cache: any;

  const mockService = {
    id: 'svc-1',
    companyId: 'company-1',
    name: 'Corte Degradê',
    description: 'Corte com máquina e tesoura',
    durationMinutes: 45,
    price: 50,
    commissionType: 'PERCENTAGE',
    commissionValue: 30,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      service: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockService]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockService),
        update: jest
          .fn()
          .mockImplementation((args) => ({ ...mockService, ...args.data })),
      },
      appointment: { count: jest.fn().mockResolvedValue(0) },
      serviceOrderItem: { count: jest.fn().mockResolvedValue(0) },
    };

    auditService = { create: jest.fn() };
    cache = {
      getOrSet: jest.fn((_key, fn) => fn()),
      del: jest.fn(),
      delByPrefix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve filtrar por search', async () => {
      await service.findAll('company-1', { search: 'Corte' });
      expect(prisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Corte', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('deve excluir deletados', async () => {
      await service.findAll('company-1', {});
      expect(prisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar serviço', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      const result = await service.findOne('company-1', 'svc-1');
      expect(result.name).toBe('Corte Degradê');
    });

    it('deve lançar NotFoundException', async () => {
      prisma.service.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = { name: 'Barba', durationMinutes: 30, price: 35 };

    it('deve criar serviço', async () => {
      prisma.service.create.mockResolvedValue({
        ...mockService,
        name: 'Barba',
      });
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.name).toBe('Barba');
    });

    it('deve registrar auditoria', async () => {
      await service.create('company-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE' }),
      );
    });

    it('deve aceitar comissão', async () => {
      const dtoComissao = {
        name: 'Hidratação',
        durationMinutes: 60,
        price: 80,
        commissionType: 'PERCENTAGE',
        commissionValue: 40,
      };
      await service.create('company-1', 'user-1', dtoComissao);
      expect(prisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commissionType: 'PERCENTAGE',
            commissionValue: 40,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar serviço', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.service.update.mockResolvedValue({ ...mockService, price: 60 });
      const result = await service.update('company-1', 'svc-1', 'user-1', {
        price: 60,
      });
      expect(result.price).toBe(60);
    });

    it('deve lançar NotFoundException', async () => {
      prisma.service.findFirst.mockResolvedValue(null);
      await expect(
        service.update('company-1', 'invalid', 'user-1', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      await service.update('company-1', 'svc-1', 'user-1', { name: 'Novo' });
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete quando não vinculado', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      const result = await service.remove('company-1', 'svc-1', 'user-1');
      expect(result.active).toBe(false);
    });

    it('deve lançar ConflictException quando vinculado a appointments', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.count.mockResolvedValue(1);
      await expect(
        service.remove('company-1', 'svc-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException quando vinculado a service_order_items', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.count.mockResolvedValue(0);
      prisma.serviceOrderItem.count.mockResolvedValue(1);
      await expect(
        service.remove('company-1', 'svc-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar NotFoundException', async () => {
      prisma.service.findFirst.mockResolvedValue(null);
      await expect(
        service.remove('company-1', 'invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      await service.remove('company-1', 'svc-1', 'user-1');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE' }),
      );
    });
  });
});

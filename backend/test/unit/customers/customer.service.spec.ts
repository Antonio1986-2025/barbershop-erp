import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from '../../../src/modules/customer/customer.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: any;
  let auditService: any;

  const mockCustomer = {
    id: 'cust-1',
    companyId: 'company-1',
    name: 'João Cliente',
    email: 'joao@test.com',
    phone: '11988887777',
    document: '12345678900',
    birthDate: new Date('1990-01-01'),
    notes: 'Cliente regular',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockCustomer]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockCustomer),
        update: jest.fn().mockResolvedValue(mockCustomer),
      },
    };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve aplicar filtro search', async () => {
      await service.findAll('company-1', { search: 'João' });
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('deve aplicar filtro active', async () => {
      await service.findAll('company-1', { active: 'true' });
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        }),
      );
    });

    it('deve excluir deletados', async () => {
      await service.findAll('company-1', {});
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('deve suportar paginação', async () => {
      await service.findAll('company-1', { page: 2, limit: 5 });
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar cliente por ID', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      const result = await service.findOne('company-1', 'cust-1');
      expect(result.id).toBe('cust-1');
    });

    it('deve lançar NotFoundException para cliente inexistente', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Novo Cliente',
      email: 'novo@test.com',
      phone: '11977776666',
    };

    it('deve criar cliente com sucesso', async () => {
      prisma.customer.create.mockResolvedValue({
        ...mockCustomer,
        name: 'Novo Cliente',
      });
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.name).toBe('Novo Cliente');
    });

    it('deve converter birthDate string para Date', async () => {
      await service.create('company-1', 'user-1', {
        ...dto,
        birthDate: '1995-05-15',
      });
      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ birthDate: expect.any(Date) }),
        }),
      );
    });

    it('deve registrar auditoria', async () => {
      await service.create('company-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'customer' }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar cliente', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        name: 'Nome Atualizado',
      });
      const result = await service.update('company-1', 'cust-1', 'user-1', {
        name: 'Nome Atualizado',
      });
      expect(result.name).toBe('Nome Atualizado');
    });

    it('deve lançar NotFoundException se não existir', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(
        service.update('company-1', 'invalid', 'user-1', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      await service.update('company-1', 'cust-1', 'user-1', { name: 'Novo' });
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        deletedAt: new Date(),
        active: false,
      });
      const result = await service.remove('company-1', 'cust-1', 'user-1');
      expect(result.active).toBe(false);
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            active: false,
          }),
        }),
      );
    });

    it('deve lançar NotFoundException se não existir', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(
        service.remove('company-1', 'invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      await service.remove('company-1', 'cust-1', 'user-1');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE' }),
      );
    });
  });
});

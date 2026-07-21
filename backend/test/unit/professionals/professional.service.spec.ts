import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalService } from '../../../src/modules/professional/professional.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('ProfessionalService', () => {
  let service: ProfessionalService;
  let prisma: any;
  let auditService: any;

  const base = {
    id: 'prof-1',
    companyId: 'company-1',
    name: 'Carlos Profissional',
    email: 'carlos@test.com',
    phone: '11966665555',
    document: '98765432100',
    specialty: 'Corte Masculino',
    commissionRate: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockProfessional = {
    ...base,
    units: [
      {
        id: 'pu-1',
        professionalId: 'prof-1',
        unitId: 'unit-1',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: {
          id: 'unit-1',
          name: 'Unidade Centro',
          companyId: 'company-1',
          code: 'UC',
          status: 'ACTIVE',
        },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      professional: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockProfessional]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockProfessional),
        update: jest.fn().mockResolvedValue(mockProfessional),
      },
      professionalUnit: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ProfessionalService>(ProfessionalService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista paginada com unidades', async () => {
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.data[0].units).toBeDefined();
      expect(result.meta.page).toBe(1);
    });

    it('deve filtrar por unitId', async () => {
      await service.findAll('company-1', { unitId: 'unit-1' });
      expect(prisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            units: { some: { unitId: 'unit-1' } },
          }),
        }),
      );
    });

    it('deve filtrar por search', async () => {
      await service.findAll('company-1', { search: 'Carlos' });
      expect(prisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('deve excluir deletados', async () => {
      await service.findAll('company-1', {});
      expect(prisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar profissional com unidades', async () => {
      prisma.professional.findFirst.mockResolvedValue(mockProfessional);
      const result = await service.findOne('company-1', 'prof-1');
      expect(result.id).toBe('prof-1');
      expect(result.units).toHaveLength(1);
    });

    it('deve lançar NotFoundException', async () => {
      prisma.professional.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Novo Prof',
      email: 'novo@test.com',
      phone: '11955554444',
    };

    it('deve criar profissional', async () => {
      prisma.professional.create.mockResolvedValue(mockProfessional);
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.id).toBe('prof-1');
    });

    it('deve criar com vínculo de unidades', async () => {
      const dtoComUnidades = { ...dto, unitIds: ['unit-1', 'unit-2'] };
      await service.create('company-1', 'user-1', dtoComUnidades);
      expect(prisma.professional.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            units: { create: [{ unitId: 'unit-1' }, { unitId: 'unit-2' }] },
          }),
        }),
      );
    });

    it('deve registrar auditoria', async () => {
      await service.create('company-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE' }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar dados', async () => {
      prisma.professional.findFirst.mockResolvedValue(mockProfessional);
      await service.update('company-1', 'prof-1', 'user-1', {
        name: 'Nome Novo',
      });
      expect(prisma.professional.update).toHaveBeenCalled();
    });

    it('deve sincronizar vínculos se unitIds fornecido', async () => {
      prisma.professional.findFirst.mockResolvedValue(mockProfessional);
      await service.update('company-1', 'prof-1', 'user-1', {
        unitIds: ['unit-2'],
      });
      expect(prisma.professionalUnit.deleteMany).toHaveBeenCalledWith({
        where: { professionalId: 'prof-1' },
      });
      expect(prisma.professionalUnit.createMany).toHaveBeenCalledWith({
        data: [{ professionalId: 'prof-1', unitId: 'unit-2' }],
      });
    });

    it('deve remover vínculos se unitIds vazio', async () => {
      prisma.professional.findFirst.mockResolvedValue(mockProfessional);
      await service.update('company-1', 'prof-1', 'user-1', { unitIds: [] });
      expect(prisma.professionalUnit.deleteMany).toHaveBeenCalled();
      expect(prisma.professionalUnit.createMany).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException', async () => {
      prisma.professional.findFirst.mockResolvedValue(null);
      await expect(
        service.update('company-1', 'invalid', 'user-1', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.professional.findFirst.mockResolvedValue(mockProfessional);
      await service.update('company-1', 'prof-1', 'user-1', { name: 'Novo' });
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete', async () => {
      prisma.professional.findFirst.mockResolvedValue(mockProfessional);
      prisma.professional.update.mockResolvedValue({
        ...base,
        deletedAt: new Date(),
        active: false,
        units: [],
      });
      const result = await service.remove('company-1', 'prof-1', 'user-1');
      expect(result.active).toBe(false);
    });

    it('deve lançar NotFoundException', async () => {
      prisma.professional.findFirst.mockResolvedValue(null);
      await expect(
        service.remove('company-1', 'invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria', async () => {
      prisma.professional.findFirst.mockResolvedValue(mockProfessional);
      await service.remove('company-1', 'prof-1', 'user-1');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE' }),
      );
    });
  });
});

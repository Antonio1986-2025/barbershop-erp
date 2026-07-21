jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../src/modules/user/user.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('UserService', () => {
  let service: UserService;
  let prisma: any;
  let auditService: any;

  const mockUserBase = {
    id: 'user-1',
    companyId: 'company-1',
    name: 'João Silva',
    email: 'joao@test.com',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    lastLoginAt: null,
    roles: [{ role: { id: 'role-1', name: 'Admin', slug: 'admin' } }],
  };

  const mockUserWithRoles = {
    ...mockUserBase,
    roles: [{ role: { id: 'role-1', name: 'Admin', slug: 'admin' } }],
  };

  beforeEach(async () => {
    const findManyResult = {
      data: [mockUserWithRoles],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockUserWithRoles]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockUserWithRoles),
        update: jest.fn().mockResolvedValue(mockUserWithRoles),
      },
      userRole: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de usuários', async () => {
      prisma.user.findMany.mockResolvedValue([mockUserWithRoles]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll('company-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve aplicar filtro de busca por nome', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll('company-1', { search: 'João' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({ contains: 'João' }),
              }),
            ]),
          }),
        }),
      );
    });

    it('deve aplicar filtro por roleId', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll('company-1', { roleId: 'role-admin' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roles: { some: { roleId: 'role-admin' } },
          }),
        }),
      );
    });

    it('deve aplicar filtro de active', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll('company-1', { active: 'true' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        }),
      );
    });

    it('deve excluir usuários deletados (soft delete)', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll('company-1', {});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('deve suportar paginação com page e limit', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll('company-1', { page: 2, limit: 5 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('nunca deve retornar passwordHash', async () => {
      prisma.user.findMany.mockResolvedValue([mockUserWithRoles]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll('company-1', {});

      for (const user of result.data) {
        expect(user).not.toHaveProperty('passwordHash');
      }
    });
  });

  describe('findOne', () => {
    it('deve retornar usuário por ID', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserWithRoles);

      const result = await service.findOne('company-1', 'user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('joao@test.com');
    });

    it('deve lançar NotFoundException para usuário inexistente', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('company-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve respeitar o scopo da empresa', async () => {
      prisma.user.findFirst.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      await expect(service.findOne('company-2', 'user-1')).rejects.toThrow();
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Maria Souza',
      email: 'maria@test.com',
      password: '123456',
      phone: '11988887777',
    };

    it('deve criar usuário com sucesso', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-new',
        name: 'Maria Souza',
        email: 'maria@test.com',
        active: true,
        createdAt: new Date(),
        roles: [],
      });

      const result = await service.create('company-1', 'admin-id', createDto);

      expect(result.name).toBe('Maria Souza');
      expect(result.email).toBe('maria@test.com');
    });

    it('deve lançar ConflictException para email duplicado', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserBase);

      await expect(
        service.create('company-1', 'admin-id', createDto),
      ).rejects.toThrow(ConflictException);
    });

    it('deve fazer hash da senha com argon2', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-new',
        name: 'Maria Souza',
        email: 'maria@test.com',
        active: true,
        createdAt: new Date(),
        roles: [],
      });

      await service.create('company-1', 'admin-id', createDto);

      expect(argon2.hash).toHaveBeenCalledWith('123456');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: 'hashed-password' }),
        }),
      );
    });

    it('deve associar roles se fornecidas', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-new',
        name: 'Maria Souza',
        email: 'maria@test.com',
        active: true,
        createdAt: new Date(),
        roles: [{ role: { id: 'role-1', name: 'Admin', slug: 'admin' } }],
      });

      const result = await service.create('company-1', 'admin-id', {
        ...createDto,
        roleIds: ['role-1'],
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roles: expect.objectContaining({
              create: expect.arrayContaining([{ roleId: 'role-1' }]),
            }),
          }),
        }),
      );
    });

    it('deve registrar auditoria na criação', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-new',
        name: 'Maria Souza',
        email: 'maria@test.com',
        active: true,
        createdAt: new Date(),
        roles: [],
      });

      await service.create('company-1', 'admin-id', createDto);

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'user' }),
      );
    });

    it('não deve retornar passwordHash no resultado', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-new',
        name: 'Maria Souza',
        email: 'maria@test.com',
        active: true,
        createdAt: new Date(),
        roles: [],
      });

      const result = await service.create('company-1', 'admin-id', createDto);

      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('update', () => {
    const updateDto = { name: 'João Updated' };

    it('deve atualizar usuário com sucesso', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserBase);
      prisma.user.findUnique.mockResolvedValue(mockUserBase);

      const result = await service.update(
        'company-1',
        'user-1',
        'admin-id',
        updateDto,
      );

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      prisma.user.findFirst.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      await expect(
        service.update('company-1', 'non-existent', 'admin-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException para email duplicado', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(mockUserBase) // findOne
        .mockResolvedValueOnce({ id: 'other-user' }); // duplicate email check

      await expect(
        service.update('company-1', 'user-1', 'admin-id', {
          email: 'other@test.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve fazer hash da nova senha se fornecida', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserBase);
      prisma.user.findUnique.mockResolvedValue(mockUserBase);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.update('company-1', 'user-1', 'admin-id', {
        password: 'new-password',
      });

      expect(argon2.hash).toHaveBeenCalledWith('new-password');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'new-hashed-password',
          }),
        }),
      );
    });

    it('deve atualizar roles se roleIds for fornecido', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserBase);
      prisma.user.findUnique.mockResolvedValue(mockUserBase);

      await service.update('company-1', 'user-1', 'admin-id', {
        roleIds: ['role-2', 'role-3'],
      });

      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.userRole.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', roleId: 'role-2' },
          { userId: 'user-1', roleId: 'role-3' },
        ],
      });
    });

    it('deve registrar auditoria na atualização', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserBase);
      prisma.user.findUnique.mockResolvedValue(mockUserBase);

      await service.update('company-1', 'user-1', 'admin-id', updateDto);

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete no usuário', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserBase);
      prisma.user.update.mockResolvedValue({
        ...mockUserBase,
        active: false,
        deletedAt: new Date(),
      });

      const result = await service.remove('company-1', 'user-1', 'admin-id');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            active: false,
          }),
        }),
      );
    });

    it('deve lançar NotFoundException para usuário inexistente', async () => {
      prisma.user.findFirst.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      await expect(
        service.remove('company-1', 'non-existent', 'admin-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve registrar auditoria no delete', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserBase);
      prisma.user.update.mockResolvedValue({
        ...mockUserBase,
        active: false,
        deletedAt: new Date(),
      });

      await service.remove('company-1', 'user-1', 'admin-id');

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE' }),
      );
    });
  });
});

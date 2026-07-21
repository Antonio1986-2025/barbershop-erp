jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let auditService: any;

  const mockCompany = { id: 'company-1', corporateName: 'Test Company' };

  const mockUser = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@test.com',
    passwordHash: 'hashed-password',
    active: true,
    companyId: 'company-1',
    company: mockCompany,
    roles: [{ role: { slug: 'admin', permissions: [{ permission: { slug: 'users.view' } }] } }],
  };

  const mockRefreshToken = {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: 'hashed-refresh',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
    ipAddress: null,
    userAgent: null,
    user: mockUser,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-new' }),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = { sign: jest.fn().mockReturnValue('jwt-token') };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve retornar tokens e usuário para credenciais válidas', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-rt');

      const result = await service.login({ email: 'admin@test.com', password: '123456' });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.companyName).toBe('Test Company');
      expect(result.user.roles).toEqual(['admin']);
      expect(result.user.permissions).toEqual(['users.view']);
    });

    it('deve lançar UnauthorizedException para senha inválida', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para usuário inexistente', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para usuário inativo', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...mockUser, active: false });

      await expect(
        service.login({ email: 'inactive@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve gerar JWT com payload correto', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-rt');

      await service.login({ email: 'admin@test.com', password: '123456' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'admin@test.com',
        companyId: 'company-1',
      });
    });

    it('deve criar refresh token no login', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-rt');

      await service.login({ email: 'admin@test.com', password: '123456' });

      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('deve registrar auditoria no login', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-rt');

      await service.login({ email: 'admin@test.com', password: '123456' });

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', userId: 'user-1' }),
      );
    });
  });

  describe('refresh', () => {
    it('deve retornar novos tokens para refresh token válido', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockRefreshToken);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-rt');

      const result = await service.refresh({ refreshToken: 'valid-rt' });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('deve revogar refresh token anterior', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockRefreshToken);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-rt');

      await service.refresh({ refreshToken: 'valid-rt' });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('deve lançar UnauthorizedException para refresh token revogado', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'revoked-rt' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para refresh token expirado', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'expired-rt' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para refresh token inválido (hash mismatch)', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockRefreshToken);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refresh({ refreshToken: 'invalid-rt' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve registrar auditoria no refresh', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockRefreshToken);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-rt');

      await service.refresh({ refreshToken: 'valid-rt' });

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REFRESH_TOKEN' }),
      );
    });
  });

  describe('logout', () => {
    it('deve revogar todos os refresh tokens do usuário', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      prisma.user.findUnique.mockResolvedValue({ companyId: 'company-1' });

      const result = await service.logout('user-1');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.message).toBe('Sessão encerrada');
    });

    it('deve registrar auditoria no logout', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue({ companyId: 'company-1' });

      await service.logout('user-1');

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGOUT' }),
      );
    });
  });

  describe('me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.me('user-1');

      expect(result.email).toBe('admin@test.com');
      expect(result.companyName).toBe('Test Company');
      expect(result.roles).toEqual(['admin']);
      expect(result.permissions).toEqual(['users.view']);
    });

    it('deve lançar UnauthorizedException se usuário não existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.me('non-existent')).rejects.toThrow(UnauthorizedException);
    });

    it('não deve expor passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.me('user-1');

      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});

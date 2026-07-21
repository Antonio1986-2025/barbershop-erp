import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const ACCESS_TOKEN_EXPIRY = '30m';
const REFRESH_TOKEN_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        company: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    };

    const permissions: string[] = [];
    const roles: string[] = [];
    for (const ur of user.roles) {
      roles.push(ur.role.slug);
      for (const rp of ur.role.permissions) {
        permissions.push(rp.permission.slug);
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id, ipAddress, userAgent);

    await this.auditService.create({
      companyId: user.companyId,
      userId: user.id,
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        companyName: user.company.corporateName,
        roles,
        permissions: [...new Set(permissions)],
      },
    };
  }

  async refresh(dto: RefreshDto, ipAddress?: string, userAgent?: string) {
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: { user: { include: { company: true } } },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const valid = await argon2.verify(refreshToken.tokenHash, dto.refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: refreshToken.user.id,
      email: refreshToken.user.email,
      companyId: refreshToken.user.companyId,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.createRefreshToken(
      refreshToken.userId,
      ipAddress ?? refreshToken.ipAddress ?? undefined,
      userAgent ?? refreshToken.userAgent ?? undefined,
    );

    await this.auditService.create({
      companyId: refreshToken.user.companyId,
      userId: refreshToken.userId,
      action: 'REFRESH_TOKEN',
      entity: 'user',
      entityId: refreshToken.userId,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (user) {
      await this.auditService.create({
        companyId: user.companyId,
        userId,
        action: 'LOGOUT',
        entity: 'user',
        entityId: userId,
      });
    }

    return { message: 'Sessão encerrada' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const permissions: string[] = [];
    const roles: string[] = [];
    for (const ur of user.roles) {
      roles.push(ur.role.slug);
      for (const rp of ur.role.permissions) {
        permissions.push(rp.permission.slug);
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      companyId: user.companyId,
      companyName: user.company.corporateName,
      roles,
      permissions: [...new Set(permissions)],
    };
  }

  private async createRefreshToken(userId: string, ipAddress?: string, userAgent?: string) {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = await argon2.hash(rawToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    return rawToken;
  }
}

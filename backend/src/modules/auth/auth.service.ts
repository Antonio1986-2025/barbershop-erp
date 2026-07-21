import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto) {
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

    await this.auditService.create({
      companyId: user.companyId,
      userId: user.id,
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
    });

    return {
      accessToken: this.jwtService.sign(payload),
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
}

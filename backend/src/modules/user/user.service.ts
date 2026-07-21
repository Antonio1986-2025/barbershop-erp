import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      active?: string;
      roleId?: string;
      orderBy?: string;
      orderDir?: 'asc' | 'desc';
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId, deletedAt: null };

    if (query.active !== undefined && query.active !== '') {
      where.active = query.active === 'true';
    }

    if (query.roleId) {
      where.roles = { some: { roleId: query.roleId } };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
        select: {
          id: true,
          companyId: true,
          name: true,
          email: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          roles: { include: { role: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        roles: { include: { role: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(companyId: string, userId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, companyId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este email na empresa');
    }

    const passwordHash = await argon2.hash(dto.password);

    const { roleIds, password, ...data } = dto;

    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash,
        companyId,
        createdBy: userId,
        roles: roleIds?.length
          ? { create: roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        createdAt: true,
        roles: { include: { role: { select: { id: true, name: true, slug: true } } } },
      },
    });
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateUserDto,
  ) {
    await this.findOne(companyId, id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          companyId,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Já existe outro usuário com este email na empresa');
      }
    }

    const { roleIds, password, ...data } = dto;

    const updateData: any = { ...data, updatedBy: userId };

    if (password) {
      updateData.passwordHash = await argon2.hash(password);
    }

    if (roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        roles: { include: { role: { select: { id: true, name: true, slug: true } } } },
      },
    });
  }

  async remove(companyId: string, id: string, userId: string) {
    await this.findOne(companyId, id);
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        active: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        deletedAt: true,
      },
    });
  }
}

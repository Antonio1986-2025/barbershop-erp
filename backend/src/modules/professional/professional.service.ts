import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      active?: string;
      unitId?: string;
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

    if (query.unitId) {
      where.units = { some: { unitId: query.unitId } };
    }

    if (query.search) {
      const s = query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { document: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.professional.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
        include: {
          units: { include: { unit: true } },
        },
      }),
      this.prisma.professional.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const professional = await this.prisma.professional.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        units: { include: { unit: true } },
      },
    });
    if (!professional)
      throw new NotFoundException('Profissional não encontrado');
    return professional;
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateProfessionalDto,
  ) {
    const { unitIds, ...data } = dto;

    const result = await this.prisma.professional.create({
      data: {
        ...data,
        companyId,
        createdBy: userId,
        units: unitIds?.length
          ? {
              create: unitIds.map((unitId) => ({ unitId })),
            }
          : undefined,
      },
      include: { units: { include: { unit: true } } },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'professional',
      entityId: result.id,
      newData: result as any,
    });

    return result;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateProfessionalDto,
  ) {
    const old = await this.findOne(companyId, id);

    const { unitIds, ...data } = dto;

    if (unitIds !== undefined) {
      await this.prisma.professionalUnit.deleteMany({
        where: { professionalId: id },
      });

      if (unitIds.length > 0) {
        await this.prisma.professionalUnit.createMany({
          data: unitIds.map((unitId) => ({ professionalId: id, unitId })),
        });
      }
    }

    const result = await this.prisma.professional.update({
      where: { id },
      data: { ...data, updatedBy: userId },
      include: { units: { include: { unit: true } } },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'professional',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    const result = await this.prisma.professional.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        active: false,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'professional',
      entityId: id,
      oldData: old as any,
    });

    return result;
  }
}

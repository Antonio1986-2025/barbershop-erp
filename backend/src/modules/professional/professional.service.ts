import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalService {
  constructor(private readonly prisma: PrismaService) {}

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

    const professional = await this.prisma.professional.create({
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

    return professional;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateProfessionalDto,
  ) {
    await this.findOne(companyId, id);

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

    return this.prisma.professional.update({
      where: { id },
      data: { ...data, updatedBy: userId },
      include: { units: { include: { unit: true } } },
    });
  }

  async remove(companyId: string, id: string, userId: string) {
    await this.findOne(companyId, id);
    return this.prisma.professional.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        active: false,
      },
    });
  }
}

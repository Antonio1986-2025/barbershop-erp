import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      active?: string;
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

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }

  async create(companyId: string, userId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        price: dto.price,
        commissionType: dto.commissionType,
        commissionValue: dto.commissionValue,
        companyId,
        createdBy: userId,
      },
    });
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateServiceDto,
  ) {
    await this.findOne(companyId, id);
    return this.prisma.service.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(companyId: string, id: string, userId: string) {
    await this.findOne(companyId, id);

    const [appointmentCount, itemCount] = await Promise.all([
      this.prisma.appointment.count({
        where: { serviceId: id, deletedAt: null },
      }),
      this.prisma.serviceOrderItem.count({
        where: { serviceId: id },
      }),
    ]);

    if (appointmentCount > 0 || itemCount > 0) {
      const reasons: string[] = [];
      if (appointmentCount > 0) reasons.push('atendimentos');
      if (itemCount > 0) reasons.push('ordens de serviço');
      throw new ConflictException(
        `O serviço não pode ser excluído porque está vinculado a ${reasons.join(' e ')}.`,
      );
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        active: false,
      },
    });
  }
}

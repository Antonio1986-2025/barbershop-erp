import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
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
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async create(companyId: string, userId: string, dto: CreateCustomerDto) {
    const result = await this.prisma.customer.create({
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        companyId,
        createdBy: userId,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'customer',
      entityId: result.id,
      newData: result as any,
    });

    return result;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateCustomerDto,
  ) {
    const old = await this.findOne(companyId, id);
    const result = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        updatedBy: userId,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'customer',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    const result = await this.prisma.customer.update({
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
      entity: 'customer',
      entityId: id,
      oldData: old as any,
    });

    return result;
  }
}

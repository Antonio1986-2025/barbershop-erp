import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
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
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async create(companyId: string, userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    const result = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        companyId,
        createdBy: userId,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'category',
      entityId: result.id,
      newData: result as any,
    });

    return result;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateCategoryDto,
  ) {
    const old = await this.findOne(companyId, id);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          companyId,
          name: dto.name,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Já existe outra categoria com este nome');
      }
    }

    const result = await this.prisma.category.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'category',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);

    const productCount = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null, active: true },
    });

    if (productCount > 0) {
      throw new ConflictException(
        'A categoria não pode ser excluída porque possui produtos vinculados ativos.',
      );
    }

    const result = await this.prisma.category.update({
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
      entity: 'category',
      entityId: id,
      oldData: old as any,
    });

    return result;
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
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
      categoryId?: string;
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

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async create(companyId: string, userId: string, dto: CreateProductDto) {
    if (dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: { companyId, barcode: dto.barcode, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException('Já existe um produto com este código de barras');
      }
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, companyId },
      });
      if (!cat) {
        throw new NotFoundException('Categoria não encontrada ou não pertence à empresa');
      }
    }

    const result = await this.prisma.product.create({
      data: {
        name: dto.name,
        barcode: dto.barcode,
        categoryId: dto.categoryId,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        companyId,
        createdBy: userId,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'product',
      entityId: result.id,
      newData: result as any,
    });

    return result;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateProductDto,
  ) {
    const old = await this.findOne(companyId, id);

    if (dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          companyId,
          barcode: dto.barcode,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Já existe outro produto com este código de barras');
      }
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, companyId },
      });
      if (!cat) {
        throw new NotFoundException('Categoria não encontrada ou não pertence à empresa');
      }
    }

    const result = await this.prisma.product.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
      include: { category: { select: { id: true, name: true } } },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'product',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);

    const [stockCount, movementCount] = await Promise.all([
      this.prisma.stock.count({
        where: { productId: id, quantity: { gt: 0 } },
      }),
      this.prisma.stockMovement.count({
        where: { productId: id },
      }),
    ]);

    if (stockCount > 0 || movementCount > 0) {
      const reasons: string[] = [];
      if (stockCount > 0) reasons.push('estoque ativo');
      if (movementCount > 0) reasons.push('movimentações de estoque');
      throw new ConflictException(
        `O produto não pode ser excluído porque possui ${reasons.join(' e ')}.`,
      );
    }

    const result = await this.prisma.product.update({
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
      entity: 'product',
      entityId: id,
      oldData: old as any,
    });

    return result;
  }
}

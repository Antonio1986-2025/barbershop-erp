import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePurchaseDto, CreatePurchaseItemDto } from './dto/create-purchase.dto';
import { AddPurchaseItemDto } from './dto/add-purchase-item.dto';
import { StockMovementService } from './stock-movement.service';
import { Prisma, StockMovementType } from '@prisma/client';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      supplierId?: string;
      startDate?: string;
      endDate?: string;
      orderBy?: string;
      orderDir?: 'asc' | 'desc';
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
        include: {
          supplier: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, companyId },
      include: {
        supplier: { select: { id: true, name: true, document: true } },
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
      },
    });
    if (!purchase) throw new NotFoundException('Compra não encontrada');
    return purchase;
  }

  async create(companyId: string, userId: string, dto: CreatePurchaseDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Compra deve ter pelo menos um item');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId },
      select: { id: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não encontrados');
    }

    const itemsData = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: new Prisma.Decimal(item.quantity * item.unitCost),
    }));

    const totalAmount = itemsData.reduce(
      (sum, item) => sum + Number(item.totalCost),
      0,
    );

    const result = await this.prisma.purchase.create({
      data: {
        companyId,
        supplierId: dto.supplierId,
        unitId: dto.unitId,
        invoiceNumber: dto.invoiceNumber,
        notes: dto.notes,
        totalAmount,
        createdBy: userId,
        items: { create: itemsData },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'purchase',
      entityId: result.id,
      newData: { status: result.status, totalAmount: Number(result.totalAmount), itemsCount: result.items.length } as any,
    });

    return result;
  }

  async confirm(companyId: string, id: string, userId: string) {
    const purchase = await this.findOne(companyId, id);

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException(
        `Compra não pode ser confirmada. Status atual: ${purchase.status}`,
      );
    }

    const result = await this.prisma.purchase.update({
      where: { id },
      data: { status: 'CONFIRMED', updatedBy: userId },
      include: {
        supplier: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'purchase',
      entityId: id,
      oldData: { status: purchase.status } as any,
      newData: { status: 'CONFIRMED' } as any,
    });

    await Promise.all(
      result.items.map((item) =>
        this.stockMovementService.recordMovement({
          companyId,
          unitId: result.unitId,
          productId: item.productId,
          type: StockMovementType.PURCHASE,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
          referenceId: result.id,
          referenceType: 'purchase',
          description: `Compra ${result.invoiceNumber ?? ''} - ${item.product.name}`.trim(),
          userId,
        }),
      ),
    );

    return result;
  }

  async cancel(companyId: string, id: string, userId: string) {
    const purchase = await this.findOne(companyId, id);

    if (purchase.status === 'CANCELLED') {
      throw new BadRequestException('Compra já está cancelada');
    }

    if (purchase.status === 'CONFIRMED') {
      throw new BadRequestException(
        'Compra confirmada não pode ser cancelada. Recebimento já pode ter ocorrido.',
      );
    }

    const result = await this.prisma.purchase.update({
      where: { id },
      data: { status: 'CANCELLED', updatedBy: userId },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'purchase',
      entityId: id,
      oldData: { status: purchase.status } as any,
      newData: { status: 'CANCELLED' } as any,
    });

    return result;
  }

  async addItem(
    companyId: string,
    purchaseId: string,
    userId: string,
    dto: AddPurchaseItemDto,
  ) {
    const purchase = await this.findOne(companyId, purchaseId);

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException(
        'Só é possível adicionar itens em compras em rascunho',
      );
    }

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, companyId },
    });
    if (!product) {
      throw new BadRequestException('Produto não encontrado');
    }

    const totalCost = Number(dto.quantity) * Number(dto.unitCost);

    const item = await this.prisma.purchaseItem.create({
      data: {
        purchaseId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        totalCost,
      },
      include: {
        product: { select: { id: true, name: true } },
      },
    });

    await this.recalculateTotal(purchaseId);

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'purchase_item',
      entityId: item.id,
      newData: { purchaseId, productId: dto.productId, quantity: dto.quantity, totalCost } as any,
    });

    return item;
  }

  async removeItem(
    companyId: string,
    purchaseId: string,
    itemId: string,
    userId: string,
  ) {
    const purchase = await this.findOne(companyId, purchaseId);

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException(
        'Só é possível remover itens de compras em rascunho',
      );
    }

    const item = await this.prisma.purchaseItem.findFirst({
      where: { id: itemId, purchaseId },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    await this.prisma.purchaseItem.delete({ where: { id: itemId } });

    await this.recalculateTotal(purchaseId);

    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'purchase_item',
      entityId: itemId,
      oldData: { purchaseId, productId: item.productId, quantity: Number(item.quantity) } as any,
    });

    return { message: 'Item removido' };
  }

  private async recalculateTotal(purchaseId: string) {
    const items = await this.prisma.purchaseItem.findMany({
      where: { purchaseId },
    });

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.totalCost),
      0,
    );

    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { totalAmount },
    });
  }
}

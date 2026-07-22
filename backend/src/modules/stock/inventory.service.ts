import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StockMovementService } from './stock-movement.service';
import { InventoryStatus, StockMovementType, Prisma } from '@prisma/client';

const VALID_TRANSITIONS: Record<InventoryStatus, InventoryStatus[]> = {
  [InventoryStatus.OPEN]: [InventoryStatus.COUNTING, InventoryStatus.CANCELLED],
  [InventoryStatus.COUNTING]: [InventoryStatus.REVIEW, InventoryStatus.CANCELLED],
  [InventoryStatus.REVIEW]: [InventoryStatus.APPROVED, InventoryStatus.CANCELLED],
  [InventoryStatus.APPROVED]: [InventoryStatus.ADJUSTMENTS_GENERATED],
  [InventoryStatus.ADJUSTMENTS_GENERATED]: [InventoryStatus.CLOSED],
  [InventoryStatus.CLOSED]: [],
  [InventoryStatus.CANCELLED]: [],
};

@Injectable()
export class InventoryService {
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
      unitId?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (query.status) where.status = query.status;
    if (query.unitId) where.unitId = query.unitId;

    const [data, total] = await Promise.all([
      this.prisma.inventoryCount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.inventoryCount.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const inventory = await this.prisma.inventoryCount.findFirst({
      where: { id, companyId },
      include: {
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
      },
    });

    if (!inventory) throw new NotFoundException('Inventário não encontrado');
    return inventory;
  }

  async create(companyId: string, userId: string, dto: { unitId: string; notes?: string }) {
    const existingOpen = await this.prisma.inventoryCount.findFirst({
      where: { companyId, unitId: dto.unitId, status: InventoryStatus.OPEN },
    });

    if (existingOpen) {
      throw new BadRequestException(
        'Já existe um inventário aberto para esta unidade',
      );
    }

    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, companyId },
    });
    if (!unit) throw new BadRequestException('Unidade não encontrada');

    const inventory = await this.prisma.inventoryCount.create({
      data: {
        companyId,
        unitId: dto.unitId,
        notes: dto.notes,
        createdBy: userId,
      },
      include: {
        unit: { select: { id: true, name: true } },
      },
    });

    const stocks = await this.prisma.stock.findMany({
      where: { companyId, unitId: dto.unitId },
      include: {
        product: { select: { id: true, name: true, barcode: true } },
      },
    });

    if (stocks.length > 0) {
      await this.prisma.inventoryItem.createMany({
        data: stocks.map((s) => ({
          inventoryId: inventory.id,
          productId: s.productId,
          systemQuantity: s.quantity,
          countedQuantity: s.quantity,
          difference: new Prisma.Decimal(0),
          unitCost: s.avgCost,
        })),
      });
    }

    const result = await this.prisma.inventoryCount.findUnique({
      where: { id: inventory.id },
      include: {
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'inventory_count',
      entityId: inventory.id,
      newData: { unitId: dto.unitId, itemsCount: stocks.length } as any,
    });

    return result;
  }

  private async transition(
    companyId: string,
    id: string,
    userId: string,
    targetStatus: InventoryStatus,
    fields: { userField: string; timestampField: string },
  ) {
    const inventory = await this.findOne(companyId, id);

    const allowed = VALID_TRANSITIONS[inventory.status as InventoryStatus];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Transição inválida: ${inventory.status} → ${targetStatus}`,
      );
    }

    const updateData: any = {
      status: targetStatus,
      [fields.userField]: userId,
      [fields.timestampField]: new Date(),
    };

    if (targetStatus === InventoryStatus.APPROVED) {
      await this.generateAdjustments(companyId, inventory, userId);
      updateData.status = InventoryStatus.CLOSED;
    }

    const result = await this.prisma.inventoryCount.update({
      where: { id },
      data: updateData,
      include: {
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'inventory_count',
      entityId: id,
      oldData: { status: inventory.status } as any,
      newData: { status: targetStatus } as any,
    });

    return result;
  }

  private async generateAdjustments(
    companyId: string,
    inventory: any,
    userId: string,
  ) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { inventoryId: inventory.id },
      include: { product: { select: { id: true, name: true } } },
    });

    for (const item of items) {
      const diff = Number(item.difference);
      if (diff === 0) continue;

      await this.stockMovementService.recordMovement({
        companyId,
        unitId: inventory.unitId,
        productId: item.productId,
        type: StockMovementType.ADJUSTMENT,
        quantity: diff,
        unitCost: Number(item.unitCost),
        totalCost: Math.abs(diff) * Number(item.unitCost),
        referenceId: inventory.id,
        referenceType: 'inventory',
        description: `Ajuste de inventário: sistema=${item.systemQuantity}, contado=${item.countedQuantity}`,
        userId,
        skipNegativeCheck: true,
      });
    }
  }

  async addItem(
    companyId: string,
    inventoryId: string,
    userId: string,
    dto: { productId: string; countedQuantity: number; notes?: string },
  ) {
    const inventory = await this.findOne(companyId, inventoryId);

    if (inventory.status !== InventoryStatus.COUNTING) {
      throw new BadRequestException(
        'Só é possível adicionar itens durante a contagem',
      );
    }

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, companyId },
    });
    if (!product) throw new BadRequestException('Produto não encontrado');

    const stock = await this.prisma.stock.findUnique({
      where: {
        companyId_unitId_productId: {
          companyId,
          unitId: inventory.unitId,
          productId: dto.productId,
        },
      },
    });

    const systemQuantity = stock ? Number(stock.quantity) : 0;
    const unitCost = stock ? Number(stock.avgCost) : 0;
    const difference = dto.countedQuantity - systemQuantity;

    const item = await this.prisma.inventoryItem.create({
      data: {
        inventoryId,
        productId: dto.productId,
        systemQuantity,
        countedQuantity: dto.countedQuantity,
        difference,
        unitCost,
        notes: dto.notes,
      },
      include: {
        product: { select: { id: true, name: true, barcode: true } },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'inventory_item',
      entityId: item.id,
      newData: {
        inventoryId,
        productId: dto.productId,
        systemQuantity,
        countedQuantity: dto.countedQuantity,
        difference,
      } as any,
    });

    return item;
  }

  async updateItem(
    companyId: string,
    inventoryId: string,
    itemId: string,
    userId: string,
    dto: { countedQuantity: number; notes?: string },
  ) {
    const inventory = await this.findOne(companyId, inventoryId);

    if (inventory.status !== InventoryStatus.COUNTING) {
      throw new BadRequestException(
        'Só é possível alterar itens durante a contagem',
      );
    }

    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, inventoryId },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    const difference = dto.countedQuantity - Number(item.systemQuantity);

    const updated = await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        countedQuantity: dto.countedQuantity,
        difference,
        notes: dto.notes ?? item.notes,
      },
      include: {
        product: { select: { id: true, name: true, barcode: true } },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'inventory_item',
      entityId: itemId,
      oldData: { countedQuantity: Number(item.countedQuantity) } as any,
      newData: { countedQuantity: dto.countedQuantity, difference } as any,
    });

    return updated;
  }

  start(companyId: string, id: string, userId: string) {
    return this.transition(companyId, id, userId, InventoryStatus.COUNTING, {
      userField: 'startedBy',
      timestampField: 'startedAt',
    });
  }

  review(companyId: string, id: string, userId: string) {
    return this.transition(companyId, id, userId, InventoryStatus.REVIEW, {
      userField: 'reviewedBy',
      timestampField: 'reviewedAt',
    });
  }

  approve(companyId: string, id: string, userId: string) {
    return this.transition(companyId, id, userId, InventoryStatus.APPROVED, {
      userField: 'approvedBy',
      timestampField: 'approvedAt',
    });
  }

  cancel(companyId: string, id: string, userId: string) {
    return this.transition(companyId, id, userId, InventoryStatus.CANCELLED, {
      userField: 'cancelledBy',
      timestampField: 'cancelledAt',
    });
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StockAlertService } from './stock-alert.service';
import { StockMovementType, Prisma } from '@prisma/client';

const ENTRY_TYPES: StockMovementType[] = [
  StockMovementType.PURCHASE,
  StockMovementType.RETURN,
  StockMovementType.TRANSFER_IN,
  StockMovementType.ADJUSTMENT,
];

const OUT_TYPES: StockMovementType[] = [
  StockMovementType.SALE,
  StockMovementType.CONSUMPTION,
  StockMovementType.TRANSFER_OUT,
  StockMovementType.LOSS,
];

@Injectable()
export class StockMovementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly stockAlertService: StockAlertService,
  ) {}

  async recordMovement(params: {
    companyId: string;
    unitId: string;
    productId: string;
    type: StockMovementType;
    quantity: number;
    unitCost?: number;
    totalCost?: number;
    referenceId?: string;
    referenceType?: string;
    description?: string;
    userId: string;
    skipNegativeCheck?: boolean;
  }) {
    const isEntry = ENTRY_TYPES.includes(params.type);
    const isOut = OUT_TYPES.includes(params.type);

    let sign: number;
    if (params.type === StockMovementType.ADJUSTMENT) {
      sign = params.quantity >= 0 ? 1 : -1;
    } else {
      sign = isEntry ? 1 : -1;
    }
    const absQty = Math.abs(params.quantity);
    const effectiveQty = absQty * sign;

    const currentStock = await this.prisma.stock.findUnique({
      where: {
        companyId_unitId_productId: {
          companyId: params.companyId,
          unitId: params.unitId,
          productId: params.productId,
        },
      },
    });

    const balanceBefore = currentStock ? Number(currentStock.quantity) : 0;
    const balanceAfter = balanceBefore + effectiveQty;

    if (!params.skipNegativeCheck && balanceAfter < 0) {
      throw new BadRequestException(
        `Estoque insuficiente. Saldo atual: ${balanceBefore}, necessário: ${absQty}`,
      );
    }

    const updateAvgCost = isEntry && sign > 0;
    const avgCostBefore = currentStock ? Number(currentStock.avgCost) : 0;
    let avgCostAfter = avgCostBefore;

    if (updateAvgCost && params.unitCost) {
      const currentQty = balanceBefore;
      const incomingQty = absQty;
      const incomingCost = params.unitCost;

      avgCostAfter =
        currentQty > 0
          ? (avgCostBefore * currentQty + incomingCost * incomingQty) /
            (currentQty + incomingQty)
          : incomingCost;
    }

    const movement = await this.prisma.stockMovement.create({
      data: {
        companyId: params.companyId,
        unitId: params.unitId,
        productId: params.productId,
        type: params.type,
        quantity: absQty,
        unitCost: params.unitCost ?? null,
        totalCost: params.totalCost ?? null,
        balanceBefore,
        balanceAfter,
        avgCostBefore: isEntry ? avgCostBefore : null,
        avgCostAfter: isEntry ? avgCostAfter : null,
        referenceId: params.referenceId ?? null,
        referenceType: params.referenceType ?? null,
        description: params.description ?? null,
        createdBy: params.userId,
      },
      include: {
        product: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    await this.prisma.stock.upsert({
      where: {
        companyId_unitId_productId: {
          companyId: params.companyId,
          unitId: params.unitId,
          productId: params.productId,
        },
      },
      update: {
        quantity: balanceAfter,
        avgCost: avgCostAfter,
        updatedBy: params.userId,
      },
      create: {
        companyId: params.companyId,
        unitId: params.unitId,
        productId: params.productId,
        quantity: balanceAfter,
        avgCost: avgCostAfter,
        createdBy: params.userId,
      },
    });

    await this.auditService.create({
      companyId: params.companyId,
      userId: params.userId,
      action: 'CREATE',
      entity: 'stock_movement',
      entityId: movement.id,
      newData: {
        type: params.type,
        productId: params.productId,
        quantity: params.quantity,
        balanceBefore,
        balanceAfter,
        avgCostBefore: isEntry ? avgCostBefore : null,
        avgCostAfter: isEntry ? avgCostAfter : null,
      } as any,
    });

    await this.stockAlertService.checkAfterMovement({
      companyId: params.companyId,
      unitId: params.unitId,
      productId: params.productId,
      balanceAfter,
      userId: params.userId,
    });

    return movement;
  }

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      productId?: string;
      unitId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      referenceId?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (query.productId) where.productId = query.productId;
    if (query.unitId) where.unitId = query.unitId;
    if (query.type) where.type = query.type;
    if (query.referenceId) where.referenceId = query.referenceId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, barcode: true } },
          unit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const movement = await this.prisma.stockMovement.findFirst({
      where: { id, companyId },
      include: {
        product: { select: { id: true, name: true, barcode: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    if (!movement) throw new NotFoundException('Movimentação não encontrada');
    return movement;
  }

  async getProductStock(companyId: string, productId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { companyId, productId },
      include: {
        unit: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, barcode: true, salePrice: true, costPrice: true } },
      },
    });

    if (stocks.length === 0) {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, companyId },
        select: { id: true, name: true, barcode: true, salePrice: true, costPrice: true },
      });

      if (!product) throw new NotFoundException('Produto não encontrado');

      return {
        product,
        stocks: [],
        totalQuantity: 0,
        avgCost: 0,
      };
    }

    const totalQuantity = stocks.reduce(
      (sum, s) => sum + Number(s.quantity),
      0,
    );

    const totalValue = stocks.reduce(
      (sum, s) => sum + Number(s.quantity) * Number(s.avgCost),
      0,
    );

    const avgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return {
      product: {
        id: stocks[0].product.id,
        name: stocks[0].product.name,
        barcode: stocks[0].product.barcode,
        salePrice: stocks[0].product.salePrice,
        costPrice: stocks[0].product.costPrice,
      },
      stocks: stocks.map((s) => ({
        unitId: s.unit.id,
        unitName: s.unit.name,
        quantity: Number(s.quantity),
        avgCost: Number(s.avgCost),
      })),
      totalQuantity,
      avgCost,
    };
  }

  async adjust(
    companyId: string,
    dto: { unitId: string; productId: string; quantity: number; unitCost?: number; description?: string },
    userId: string,
  ) {
    if (dto.quantity === 0) {
      throw new BadRequestException('Quantidade deve ser diferente de zero');
    }

    return this.recordMovement({
      companyId,
      unitId: dto.unitId,
      productId: dto.productId,
      type: StockMovementType.ADJUSTMENT,
      quantity: dto.quantity,
      unitCost: dto.quantity > 0 ? dto.unitCost : undefined,
      totalCost: dto.unitCost ? Math.abs(dto.quantity) * dto.unitCost : undefined,
      description: dto.description ?? 'Ajuste manual de estoque',
      userId,
    });
  }
}

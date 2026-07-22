import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StockMovementService } from './stock-movement.service';
import { TransferStatus, StockMovementType } from '@prisma/client';

const VALID_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  [TransferStatus.PENDING]: [TransferStatus.APPROVED, TransferStatus.CANCELLED],
  [TransferStatus.APPROVED]: [TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED],
  [TransferStatus.IN_TRANSIT]: [TransferStatus.RECEIVED, TransferStatus.CANCELLED],
  [TransferStatus.RECEIVED]: [TransferStatus.COMPLETED],
  [TransferStatus.COMPLETED]: [],
  [TransferStatus.CANCELLED]: [],
};

@Injectable()
export class TransferService {
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
      productId?: string;
      fromUnitId?: string;
      toUnitId?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (query.status) where.status = query.status;
    if (query.productId) where.productId = query.productId;
    if (query.fromUnitId) where.fromUnitId = query.fromUnitId;
    if (query.toUnitId) where.toUnitId = query.toUnitId;

    const [data, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUnit: { select: { id: true, name: true } },
          toUnit: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, barcode: true } },
        },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, companyId },
      include: {
        fromUnit: { select: { id: true, name: true } },
        toUnit: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, barcode: true } },
      },
    });

    if (!transfer) throw new NotFoundException('Transferência não encontrada');
    return transfer;
  }

  async create(
    companyId: string,
    userId: string,
    dto: {
      fromUnitId: string;
      toUnitId: string;
      productId: string;
      quantity: number;
      notes?: string;
    },
  ) {
    if (dto.fromUnitId === dto.toUnitId) {
      throw new BadRequestException(
        'Origem e destino devem ser unidades diferentes',
      );
    }

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, companyId },
    });
    if (!product) throw new BadRequestException('Produto não encontrado');

    const [fromUnit, toUnit] = await Promise.all([
      this.prisma.unit.findFirst({
        where: { id: dto.fromUnitId, companyId },
      }),
      this.prisma.unit.findFirst({
        where: { id: dto.toUnitId, companyId },
      }),
    ]);

    if (!fromUnit) throw new BadRequestException('Unidade de origem não encontrada');
    if (!toUnit) throw new BadRequestException('Unidade de destino não encontrada');

    const stock = await this.prisma.stock.findUnique({
      where: {
        companyId_unitId_productId: {
          companyId,
          unitId: dto.fromUnitId,
          productId: dto.productId,
        },
      },
    });

    const currentQty = stock ? Number(stock.quantity) : 0;
    if (currentQty < dto.quantity) {
      throw new BadRequestException(
        `Saldo insuficiente na origem. Disponível: ${currentQty}, necessário: ${dto.quantity}`,
      );
    }

    const unitCost = stock ? Number(stock.avgCost) : 0;

    const transfer = await this.prisma.transfer.create({
      data: {
        companyId,
        fromUnitId: dto.fromUnitId,
        toUnitId: dto.toUnitId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitCost,
        notes: dto.notes,
        createdBy: userId,
      },
      include: {
        fromUnit: { select: { id: true, name: true } },
        toUnit: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, barcode: true } },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'transfer',
      entityId: transfer.id,
      newData: {
        fromUnitId: dto.fromUnitId,
        toUnitId: dto.toUnitId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitCost,
      } as any,
    });

    return transfer;
  }

  private async transition(
    companyId: string,
    id: string,
    userId: string,
    targetStatus: TransferStatus,
    field: 'approvedBy' | 'sentBy' | 'receivedBy' | 'cancelledBy',
    timestampField: 'approvedAt' | 'sentAt' | 'receivedAt' | 'cancelledAt',
  ) {
    const transfer = await this.findOne(companyId, id);

    const allowed = VALID_TRANSITIONS[transfer.status as TransferStatus];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Transição inválida: ${transfer.status} → ${targetStatus}`,
      );
    }

    const updateData: any = {
      status: targetStatus,
      [field]: userId,
      [timestampField]: new Date(),
    };

    const result = await this.prisma.transfer.update({
      where: { id },
      data: updateData,
      include: {
        fromUnit: { select: { id: true, name: true } },
        toUnit: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, barcode: true } },
      },
    });

    if (targetStatus === TransferStatus.RECEIVED) {
      await Promise.all([
        this.stockMovementService.recordMovement({
          companyId,
          unitId: transfer.fromUnitId,
          productId: transfer.productId,
          type: StockMovementType.TRANSFER_OUT,
          quantity: Number(transfer.quantity),
          unitCost: Number(transfer.unitCost),
          totalCost: Number(transfer.quantity) * Number(transfer.unitCost),
          referenceId: transfer.id,
          referenceType: 'transfer',
          description: `Transferência para ${transfer.toUnitId}`,
          userId,
        }),
        this.stockMovementService.recordMovement({
          companyId,
          unitId: transfer.toUnitId,
          productId: transfer.productId,
          type: StockMovementType.TRANSFER_IN,
          quantity: Number(transfer.quantity),
          unitCost: Number(transfer.unitCost),
          totalCost: Number(transfer.quantity) * Number(transfer.unitCost),
          referenceId: transfer.id,
          referenceType: 'transfer',
          description: `Transferência de ${transfer.fromUnitId}`,
          userId,
        }),
      ]);
    }

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'transfer',
      entityId: id,
      oldData: { status: transfer.status } as any,
      newData: { status: targetStatus } as any,
    });

    return result;
  }

  approve(companyId: string, id: string, userId: string) {
    return this.transition(
      companyId, id, userId,
      TransferStatus.APPROVED, 'approvedBy', 'approvedAt',
    );
  }

  send(companyId: string, id: string, userId: string) {
    return this.transition(
      companyId, id, userId,
      TransferStatus.IN_TRANSIT, 'sentBy', 'sentAt',
    );
  }

  receive(companyId: string, id: string, userId: string) {
    return this.transition(
      companyId, id, userId,
      TransferStatus.RECEIVED, 'receivedBy', 'receivedAt',
    );
  }

  cancel(companyId: string, id: string, userId: string) {
    return this.transition(
      companyId, id, userId,
      TransferStatus.CANCELLED, 'cancelledBy', 'cancelledAt',
    );
  }
}

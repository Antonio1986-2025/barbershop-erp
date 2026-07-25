import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StockMovementService } from '../stock/stock-movement.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FinancialService } from '../financial/financial.service';
import { CashbackService } from '../cashback/cashback.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { AddSaleItemDto } from './dto/add-sale-item.dto';
import { UpdateSaleItemDto } from './dto/update-sale-item.dto';
import { Prisma, StockMovementType } from '@prisma/client';

@Injectable()
export class SaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly stockMovementService: StockMovementService,
    private readonly notificationsService: NotificationsService,
    private readonly financialService: FinancialService,
    private readonly cashbackService: CashbackService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      customerId?: string;
      unitId?: string;
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
    if (query.customerId) where.customerId = query.customerId;
    if (query.unitId) where.unitId = query.unitId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
        include: {
          unit: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
              service: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, companyId },
      include: {
        unit: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!sale) throw new NotFoundException('Venda não encontrada');
    return sale;
  }

  async create(companyId: string, userId: string, dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Venda deve ter pelo menos um item');
    }

    const itemsData = await this.buildItemsData(companyId, dto.items, userId);

    const subtotal = itemsData.reduce((sum, i) => sum + Number(i.totalPrice), 0);
    const total = subtotal;

    const result = await this.prisma.sale.create({
      data: {
        companyId,
        unitId: dto.unitId,
        customerId: dto.customerId,
        notes: dto.notes,
        subtotal,
        total,
        createdBy: userId,
        items: { create: itemsData },
      },
      include: {
        unit: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'sale',
      entityId: result.id,
      newData: { status: result.status, total: Number(result.total), itemsCount: result.items.length } as any,
    });

    return result;
  }

  async update(companyId: string, id: string, userId: string, dto: UpdateSaleDto) {
    const sale = await this.findOne(companyId, id);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException('Apenas vendas em rascunho podem ser editadas');
    }

    const result = await this.prisma.sale.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        notes: dto.notes,
        updatedBy: userId,
      },
      include: {
        unit: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'sale',
      entityId: id,
      oldData: { customerId: sale.customerId, notes: sale.notes } as any,
      newData: { customerId: result.customerId, notes: result.notes } as any,
    });

    return result;
  }

  async open(companyId: string, id: string, userId: string) {
    const sale = await this.findOne(companyId, id);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException(`Venda não pode ser aberta. Status atual: ${sale.status}`);
    }

    if (sale.items.length === 0) {
      throw new BadRequestException('Venda deve ter pelo menos um item para ser aberta');
    }

    const result = await this.prisma.sale.update({
      where: { id },
      data: { status: 'OPEN', updatedBy: userId },
      include: {
        unit: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'sale',
      entityId: id,
      oldData: { status: sale.status } as any,
      newData: { status: 'OPEN' } as any,
    });

    return result;
  }

  async cancel(companyId: string, id: string, userId: string, reason?: string) {
    const sale = await this.findOne(companyId, id);

    if (sale.status === 'CANCELLED') {
      throw new BadRequestException('Venda já está cancelada');
    }

    if (sale.status === 'REFUNDED') {
      throw new BadRequestException('Venda reembolsada não pode ser cancelada');
    }

    if (sale.status === 'PAID') {
      await this.reverseStock(companyId, sale, userId, 'cancelamento');
      await this.reverseFinancial(companyId, sale, userId, 'CANCELLED');
      await this.cashbackService.cancelBySale(companyId, id, 'CANCELLED');
      await this.loyaltyService.cancelBySale(companyId, id);
    }

    const result = await this.prisma.sale.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancelledReason: reason,
        updatedBy: userId,
      },
      include: {
        unit: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'sale',
      entityId: id,
      oldData: { status: sale.status } as any,
      newData: { status: 'CANCELLED', cancelledReason: reason } as any,
    });

    await this.notificationsService.create(companyId, userId, {
      companyId,
      userId,
      type: 'SALE_CANCELLED',
      title: 'Venda cancelada',
      message: `Venda ${id} cancelada${reason ? `: ${reason}` : ''}. Estoque revertido.`,
    });

    return result;
  }

  async refund(companyId: string, id: string, userId: string, reason?: string) {
    const sale = await this.findOne(companyId, id);

    if (sale.status === 'REFUNDED') {
      throw new BadRequestException('Venda já foi reembolsada');
    }

    if (sale.status === 'CANCELLED') {
      throw new BadRequestException('Venda cancelada não pode ser reembolsada');
    }

    if (sale.status === 'PAID') {
      await this.reverseStock(companyId, sale, userId, 'reembolso');
      await this.reverseFinancial(companyId, sale, userId, 'REFUNDED');
      await this.cashbackService.cancelBySale(companyId, id, 'REFUNDED');
      await this.loyaltyService.cancelBySale(companyId, id);
    }

    const result = await this.prisma.sale.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        refundedBy: userId,
        refundedAt: new Date(),
        refundReason: reason,
        updatedBy: userId,
      },
      include: {
        unit: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'sale',
      entityId: id,
      oldData: { status: sale.status } as any,
      newData: { status: 'REFUNDED', refundReason: reason } as any,
    });

    await this.notificationsService.create(companyId, userId, {
      companyId,
      userId,
      type: 'SALE_REFUNDED',
      title: 'Estorno realizado',
      message: `Venda ${id} estornada${reason ? `: ${reason}` : ''}. Estoque revertido.`,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const sale = await this.findOne(companyId, id);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException('Apenas vendas em rascunho podem ser removidas');
    }

    await this.prisma.sale.delete({ where: { id } });

    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'sale',
      entityId: id,
      oldData: { status: sale.status, total: Number(sale.total) } as any,
    });

    return { message: 'Venda removida' };
  }

  async addItem(companyId: string, saleId: string, userId: string, dto: AddSaleItemDto) {
    const sale = await this.findOne(companyId, saleId);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException('Apenas vendas em rascunho podem receber itens');
    }

    const snapshot = await this.getProductServiceSnapshot(companyId, dto);

    const quantity = new Prisma.Decimal(dto.quantity);
    const unitPrice = new Prisma.Decimal(dto.unitPrice);
    const totalPrice = quantity.mul(unitPrice);

    const item = await this.prisma.saleItem.create({
      data: {
        saleId,
        productId: dto.productId ?? null,
        serviceId: dto.serviceId ?? null,
        productName: snapshot.productName,
        productBarcode: snapshot.productBarcode,
        serviceName: snapshot.serviceName,
        quantity,
        unitPrice,
        costPrice: snapshot.costPrice,
        totalPrice,
      },
      include: {
        product: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });

    await this.recalculateTotals(saleId);

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'sale_item',
      entityId: item.id,
      newData: { saleId, productId: dto.productId, serviceId: dto.serviceId, quantity: dto.quantity, totalPrice: Number(totalPrice) } as any,
    });

    return item;
  }

  async updateItem(companyId: string, saleId: string, itemId: string, userId: string, dto: UpdateSaleItemDto) {
    const sale = await this.findOne(companyId, saleId);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException('Apenas vendas em rascunho podem ter itens alterados');
    }

    const item = await this.prisma.saleItem.findFirst({
      where: { id: itemId, saleId },
    });

    if (!item) throw new NotFoundException('Item não encontrado');

    const quantity = new Prisma.Decimal(dto.quantity);
    const totalPrice = quantity.mul(item.unitPrice);

    const oldData = { quantity: Number(item.quantity), totalPrice: Number(item.totalPrice) };

    const updated = await this.prisma.saleItem.update({
      where: { id: itemId },
      data: { quantity, totalPrice },
      include: {
        product: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });

    await this.recalculateTotals(saleId);

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'sale_item',
      entityId: itemId,
      oldData: oldData as any,
      newData: { quantity: dto.quantity, totalPrice: Number(totalPrice) } as any,
    });

    return updated;
  }

  async removeItem(companyId: string, saleId: string, itemId: string, userId: string) {
    const sale = await this.findOne(companyId, saleId);

    if (sale.status !== 'DRAFT') {
      throw new BadRequestException('Apenas vendas em rascunho podem ter itens removidos');
    }

    const item = await this.prisma.saleItem.findFirst({
      where: { id: itemId, saleId },
    });

    if (!item) throw new NotFoundException('Item não encontrado');

    await this.prisma.saleItem.delete({ where: { id: itemId } });

    await this.recalculateTotals(saleId);

    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'sale_item',
      entityId: itemId,
      oldData: { saleId, productId: item.productId, quantity: Number(item.quantity) } as any,
    });

    return { message: 'Item removido' };
  }

  private async recalculateTotals(saleId: string) {
    const items = await this.prisma.saleItem.findMany({
      where: { saleId },
    });

    const subtotal = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
    const totalDiscount = items.reduce((sum, i) => sum + Number(i.discountAmount), 0);

    await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        subtotal,
        discountAmount: totalDiscount,
        total: subtotal - totalDiscount,
      },
    });
  }

  private async buildItemsData(
    companyId: string,
    items: Array<{ productId?: string; serviceId?: string; quantity: number; unitPrice: number }>,
    userId: string,
  ) {
    const result: Array<{
      productId: string | null;
      serviceId: string | null;
      productName: string;
      productBarcode: string | null;
      serviceName: string | null;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      costPrice: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
    }> = [];

    for (const item of items) {
      if (!item.productId && !item.serviceId) {
        throw new BadRequestException('Cada item deve ter um productId ou serviceId');
      }

      const snapshot = await this.getProductServiceSnapshot(companyId, item);

      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const totalPrice = quantity.mul(unitPrice);

      result.push({
        productId: item.productId ?? null,
        serviceId: item.serviceId ?? null,
        productName: snapshot.productName,
        productBarcode: snapshot.productBarcode,
        serviceName: snapshot.serviceName,
        quantity,
        unitPrice,
        costPrice: snapshot.costPrice,
        totalPrice,
      });
    }

    return result;
  }

  private async reverseFinancial(
    companyId: string,
    sale: any,
    userId: string,
    newStatus: string,
  ) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: { companyId, description: `Venda ${sale.id}`, status: 'PAID' },
    });

    for (const account of accounts) {
      try {
        await this.financialService.cancelAccount(companyId, account.id, userId);
      } catch {
        // account may already be cancelled
      }
    }

    const cashPayments = await this.prisma.payment.findMany({
      where: { saleId: sale.id, paymentMethod: 'CASH', status: 'PAID' },
    });

    for (const payment of cashPayments) {
      const register = await this.prisma.cashRegister.findFirst({
        where: { companyId, unitId: sale.unitId, status: 'OPEN' },
      });

      if (register) {
        await this.prisma.cashTransaction.create({
          data: {
            companyId,
            unitId: sale.unitId,
            cashRegisterId: register.id,
            paymentId: payment.id,
            type: 'EXIT',
            amount: Number(payment.amount),
            description: `${newStatus === 'CANCELLED' ? 'Cancelamento' : 'Reembolso'} venda ${sale.id}`,
          },
        });
      }
    }
  }

  private async reverseStock(
    companyId: string,
    sale: any,
    userId: string,
    reason: string,
  ) {
    const productItems = sale.items.filter((i: any) => i.productId);

    for (const item of productItems) {
      await this.stockMovementService.recordMovement({
        companyId,
        unitId: sale.unitId,
        productId: item.productId,
        type: StockMovementType.RETURN,
        quantity: Number(item.quantity),
        referenceId: sale.id,
        referenceType: 'sale',
        description: `${reason === 'cancelamento' ? 'Cancelamento' : 'Reembolso'} venda ${sale.id} - ${item.productName}`,
        userId,
        skipNegativeCheck: true,
      });
    }
  }

  private async getProductServiceSnapshot(
    companyId: string,
    item: { productId?: string; serviceId?: string },
  ): Promise<{ productName: string; productBarcode: string | null; serviceName: string | null; costPrice: Prisma.Decimal }> {
    if (item.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, companyId },
        select: { name: true, barcode: true, costPrice: true },
      });

      if (!product) {
        throw new BadRequestException(`Produto ${item.productId} não encontrado`);
      }

      return {
        productName: product.name,
        productBarcode: product.barcode,
        serviceName: null,
        costPrice: product.costPrice,
      };
    }

    if (item.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: item.serviceId, companyId },
        select: { name: true, price: true },
      });

      if (!service) {
        throw new BadRequestException(`Serviço ${item.serviceId} não encontrado`);
      }

      return {
        productName: service.name,
        productBarcode: null,
        serviceName: service.name,
        costPrice: new Prisma.Decimal(0),
      };
    }

    throw new BadRequestException('Item deve ter productId ou serviceId');
  }
}

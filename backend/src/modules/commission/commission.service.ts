import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate commission for a sale that was paid.
   * Called from SalePaymentService when payment completes.
   * If a commission already exists for this sale, it recalculates (upsert).
   */
  async calculateForSale(companyId: string, saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        serviceOrder: {
          include: {
            professional: true,
            items: {
              include: { service: true, product: true },
            },
          },
        },
        items: {
          include: { service: true, product: true },
        },
      },
    });

    if (!sale) {
      this.logger.warn(`Sale ${saleId} not found for commission calculation`);
      return null;
    }

    // Only calculate for PAID sales
    if (sale.status !== 'PAID') {
      return null;
    }

    const serviceOrder = sale.serviceOrder;
    if (!serviceOrder) {
      this.logger.warn(`Sale ${saleId} has no service order, skipping commission`);
      return null;
    }

    const professional = serviceOrder.professional;
    if (!professional) {
      this.logger.warn(`ServiceOrder ${serviceOrder.id} has no professional, skipping commission`);
      return null;
    }

    // Calculate commission items from the sale items
    const items = sale.items;
    let totalServiceAmount = 0;
    let totalProductAmount = 0;
    let totalCommission = 0;
    const commissionItems: Array<{
      saleItemId: string;
      itemType: 'SERVICE' | 'PRODUCT';
      itemName: string;
      quantity: number;
      itemAmount: number;
      rate: number;
      commissionAmount: number;
    }> = [];

    for (const item of items) {
      const isService = !!item.serviceId;
      const baseAmount = Number(item.totalPrice);
      const quantity = Number(item.quantity);

      if (isService) {
        totalServiceAmount += baseAmount;

        // Priority chain for rate:
        // 1. Service.commissionType = 'NONE' → 0
        // 2. Service.commissionType = 'FIXED' → commissionValue
        // 3. Service.commissionType = 'PERCENTAGE' → commissionValue%
        // 4. Professional.commissionRate
        // 5. 0

        let rate = 0;
        let rateType = 'PERCENTAGE';
        const svc = item.service;

        if (svc?.commissionType === 'NONE') {
          rate = 0;
        } else if (svc?.commissionType === 'FIXED' && svc.commissionValue) {
          rate = Number(svc.commissionValue);
          rateType = 'FIXED';
        } else if (svc?.commissionType === 'PERCENTAGE' && svc.commissionValue) {
          rate = Number(svc.commissionValue);
        } else if (professional.commissionRate) {
          rate = Number(professional.commissionRate);
        }

        let itemCommission = 0;
        if (rateType === 'FIXED') {
          itemCommission = rate * quantity;
        } else {
          itemCommission = (baseAmount * rate) / 100;
        }

        totalCommission += itemCommission;
        commissionItems.push({
          saleItemId: item.id,
          itemType: 'SERVICE',
          itemName: item.serviceName || 'Serviço',
          quantity,
          itemAmount: baseAmount,
          rate,
          commissionAmount: Math.round(itemCommission * 100) / 100,
        });
      } else {
        // Product
        totalProductAmount += baseAmount;

        const rate = professional.commissionProductRate
          ? Number(professional.commissionProductRate)
          : 0;
        const itemCommission = (baseAmount * rate) / 100;

        totalCommission += itemCommission;
        commissionItems.push({
          saleItemId: item.id,
          itemType: 'PRODUCT',
          itemName: item.productName || 'Produto',
          quantity,
          itemAmount: baseAmount,
          rate,
          commissionAmount: Math.round(itemCommission * 100) / 100,
        });
      }
    }

    totalCommission = Math.round(totalCommission * 100) / 100;

    // Determine the rate applied (use professional's rate as primary)
    const rateApplied = professional.commissionRate
      ? Number(professional.commissionRate)
      : null;

    // Upsert: if commission already exists for this sale, update it
    const existing = await this.prisma.commission.findFirst({
      where: { companyId, saleId },
    });

    let commission;
    if (existing) {
      // Delete old items and recreate
      await this.prisma.commissionItem.deleteMany({
        where: { commissionId: existing.id },
      });
      commission = await this.prisma.commission.update({
        where: { id: existing.id },
        data: {
          totalServiceAmount: totalServiceAmount || null,
          totalProductAmount: totalProductAmount || null,
          commissionAmount: totalCommission,
          rateApplied,
          rateType: 'PERCENTAGE',
          status: 'PENDING',
        },
      });
    } else {
      commission = await this.prisma.commission.create({
        data: {
          companyId,
          unitId: sale.unitId,
          saleId: sale.id,
          serviceOrderId: serviceOrder.id,
          professionalId: professional.id,
          totalServiceAmount: totalServiceAmount || null,
          totalProductAmount: totalProductAmount || null,
          commissionAmount: totalCommission,
          rateApplied,
          rateType: 'PERCENTAGE',
          status: 'PENDING',
        },
      });
    }

    // Create commission items
    for (const ci of commissionItems) {
      await this.prisma.commissionItem.create({
        data: {
          commissionId: commission.id,
          saleItemId: ci.saleItemId,
          itemType: ci.itemType,
          itemName: ci.itemName,
          quantity: ci.quantity,
          itemAmount: ci.itemAmount,
          rate: ci.rate,
          commissionAmount: ci.commissionAmount,
        },
      });
    }

    this.logger.log(
      `Commission ${existing ? 'updated' : 'created'} for sale ${saleId}: ` +
        `R$${totalCommission} (${rateApplied ?? 0}% rate, ${items.length} items)`,
    );

    return commission;
  }

  /**
   * Cancel commission when sale is cancelled or refunded.
   */
  async cancelForSale(companyId: string, saleId: string, reason: string) {
    const commission = await this.prisma.commission.findFirst({
      where: { companyId, saleId, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    });

    if (!commission) {
      this.logger.warn(`No active commission found for sale ${saleId} to cancel`);
      return null;
    }

    const updated = await this.prisma.commission.update({
      where: { id: commission.id },
      data: {
        status: reason === 'REFUNDED' ? 'REFUNDED' : 'CANCELLED',
        notes: reason,
      },
    });

    this.logger.log(`Commission ${updated.status} for sale ${saleId}: ${reason}`);
    return updated;
  }

  /** List commissions, optionally filtered by professional */
  async findAll(
    companyId: string,
    query: { professionalId?: string; status?: string; page?: number; limit?: number },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = { companyId };
    if (query.professionalId) where.professionalId = query.professionalId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

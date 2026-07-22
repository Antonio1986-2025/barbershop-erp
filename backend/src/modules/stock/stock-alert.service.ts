import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StockAlertType } from '@prisma/client';

const ALERT_TYPE_LABELS: Record<StockAlertType, string> = {
  LOW_STOCK: 'Estoque mínimo',
  ZERO_STOCK: 'Estoque zerado',
  NEGATIVE_STOCK: 'Estoque negativo',
  INACTIVE_PRODUCT: 'Produto sem movimentação',
  EXPIRING_PRODUCT: 'Produto próximo do vencimento',
};

const ALERT_NOTIFICATION_TYPE_MAP: Record<StockAlertType, string> = {
  LOW_STOCK: 'STOCK_LOW',
  ZERO_STOCK: 'STOCK_ZERO',
  NEGATIVE_STOCK: 'STOCK_NEGATIVE',
  INACTIVE_PRODUCT: 'STOCK_INACTIVE',
  EXPIRING_PRODUCT: 'STOCK_EXPIRING',
};

@Injectable()
export class StockAlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      unitId?: string;
      productId?: string;
      type?: string;
      resolved?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (query.unitId) where.unitId = query.unitId;
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;
    if (query.resolved !== undefined) where.resolved = query.resolved;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.stockAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, barcode: true } },
        },
      }),
      this.prisma.stockAlert.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const alert = await this.prisma.stockAlert.findFirst({
      where: { id, companyId },
      include: {
        unit: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, barcode: true } },
      },
    });
    return alert;
  }

  async resolve(companyId: string, id: string, userId: string) {
    const alert = await this.findOne(companyId, id);
    if (!alert) return null;
    if (alert.resolved) return alert;

    const result = await this.prisma.stockAlert.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date(), resolvedBy: userId },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'stock_alert',
      entityId: id,
      oldData: { resolved: false } as any,
      newData: { resolved: true } as any,
    });

    return result;
  }

  async resolveByCondition(
    companyId: string,
    unitId: string,
    productId: string,
    type: StockAlertType,
    userId: string,
  ) {
    const open = await this.prisma.stockAlert.findFirst({
      where: {
        companyId,
        unitId,
        productId,
        type,
        resolved: false,
      },
    });

    if (!open) return null;

    return this.resolve(companyId, open.id, userId);
  }

  async countOpen(companyId: string) {
    return this.prisma.stockAlert.count({
      where: { companyId, resolved: false },
    });
  }

  async checkAfterMovement(params: {
    companyId: string;
    unitId: string;
    productId: string;
    balanceAfter: number;
    userId: string;
    productName?: string;
    unitName?: string;
  }) {
    const { companyId, unitId, productId, balanceAfter, userId } = params;

    const stock = await this.prisma.stock.findUnique({
      where: {
        companyId_unitId_productId: { companyId, unitId, productId },
      },
      include: {
        product: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    const productName = stock?.product?.name ?? params.productName ?? productId;
    const unitName = stock?.unit?.name ?? params.unitName ?? unitId;

    if (balanceAfter < 0) {
      await this.createAlert({
        companyId,
        unitId,
        productId,
        type: StockAlertType.NEGATIVE_STOCK,
        message: `Estoque negativo: ${productName} em ${unitName}`,
        details: `Saldo atual: ${balanceAfter}`,
        userId,
      });
    } else if (balanceAfter === 0) {
      await this.createAlert({
        companyId,
        unitId,
        productId,
        type: StockAlertType.ZERO_STOCK,
        message: `Estoque zerado: ${productName} em ${unitName}`,
        details: null,
        userId,
      });
    } else if (stock?.minStock && balanceAfter <= Number(stock.minStock)) {
      await this.createAlert({
        companyId,
        unitId,
        productId,
        type: StockAlertType.LOW_STOCK,
        message: `Estoque abaixo do mínimo: ${productName} em ${unitName}`,
        details: `Saldo atual: ${balanceAfter}, Mínimo: ${stock.minStock}`,
        userId,
      });
    }

    if (balanceAfter > 0) {
      await this.resolveByCondition(
        companyId, unitId, productId,
        StockAlertType.ZERO_STOCK, userId,
      );
      await this.resolveByCondition(
        companyId, unitId, productId,
        StockAlertType.NEGATIVE_STOCK, userId,
      );
    }

    if (stock?.minStock && balanceAfter > Number(stock.minStock)) {
      await this.resolveByCondition(
        companyId, unitId, productId,
        StockAlertType.LOW_STOCK, userId,
      );
    }
  }

  async checkInactiveProducts(
    companyId: string,
    days: number = 90,
    userId: string,
  ) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const products = await this.prisma.product.findMany({
      where: { companyId, active: true },
      include: {
        stocks: {
          include: { unit: { select: { id: true, name: true } } },
        },
      },
    });

    const created: any[] = [];

    for (const product of products) {
      const lastMovement = await this.prisma.stockMovement.findFirst({
        where: { companyId, productId: product.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      if (lastMovement && lastMovement.createdAt >= cutoff) continue;

      for (const stock of product.stocks) {
        if (Number(stock.quantity) === 0) continue;

        const existing = await this.prisma.stockAlert.findFirst({
          where: {
            companyId,
            unitId: stock.unitId,
            productId: product.id,
            type: StockAlertType.INACTIVE_PRODUCT,
            resolved: false,
          },
        });

        if (existing) continue;

        const alert = await this.prisma.stockAlert.create({
          data: {
            companyId,
            unitId: stock.unitId,
            productId: product.id,
            type: StockAlertType.INACTIVE_PRODUCT,
            message: `Produto sem movimentação: ${product.name} em ${stock.unit.name}`,
            details: `Última movimentação: ${lastMovement ? lastMovement.createdAt.toISOString() : ' nenhuma'}`,
          },
        });

        await this.notificationsService.create(companyId, userId, {
          companyId,
          userId,
          type: ALERT_NOTIFICATION_TYPE_MAP[StockAlertType.INACTIVE_PRODUCT],
          title: ALERT_TYPE_LABELS[StockAlertType.INACTIVE_PRODUCT],
          message: alert.message,
        });

        await this.auditService.create({
          companyId,
          userId,
          action: 'CREATE',
          entity: 'stock_alert',
          entityId: alert.id,
          newData: alert as any,
        });

        created.push(alert);
      }
    }

    return created;
  }

  async checkAll(companyId: string, userId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { companyId },
      include: {
        product: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    const results: { alertsCreated: number; alertsResolved: number } = {
      alertsCreated: 0,
      alertsResolved: 0,
    };

    for (const stock of stocks) {
      const balance = Number(stock.quantity);
      const prevCreated = results.alertsCreated;

      if (balance < 0) {
        await this.createAlert({
          companyId,
          unitId: stock.unitId,
          productId: stock.productId,
          type: StockAlertType.NEGATIVE_STOCK,
          message: `Estoque negativo: ${stock.product.name} em ${stock.unit.name}`,
          details: `Saldo atual: ${balance}`,
          userId,
        });
      } else if (balance === 0) {
        await this.createAlert({
          companyId,
          unitId: stock.unitId,
          productId: stock.productId,
          type: StockAlertType.ZERO_STOCK,
          message: `Estoque zerado: ${stock.product.name} em ${stock.unit.name}`,
          details: null,
          userId,
        });
      } else if (stock.minStock && balance <= Number(stock.minStock)) {
        await this.createAlert({
          companyId,
          unitId: stock.unitId,
          productId: stock.productId,
          type: StockAlertType.LOW_STOCK,
          message: `Estoque abaixo do mínimo: ${stock.product.name} em ${stock.unit.name}`,
          details: `Saldo atual: ${balance}, Mínimo: ${stock.minStock}`,
          userId,
        });
      }

      if (balance > 0) {
        const r1 = await this.resolveByCondition(
          companyId, stock.unitId, stock.productId,
          StockAlertType.ZERO_STOCK, userId,
        );
        const r2 = await this.resolveByCondition(
          companyId, stock.unitId, stock.productId,
          StockAlertType.NEGATIVE_STOCK, userId,
        );
        if (r1) results.alertsResolved++;
        if (r2) results.alertsResolved++;
      }

      if (stock.minStock && balance > Number(stock.minStock)) {
        const r = await this.resolveByCondition(
          companyId, stock.unitId, stock.productId,
          StockAlertType.LOW_STOCK, userId,
        );
        if (r) results.alertsResolved++;
      }

      if (results.alertsCreated > prevCreated) results.alertsCreated++;
    }

    return results;
  }

  private async createAlert(params: {
    companyId: string;
    unitId: string;
    productId: string;
    type: StockAlertType;
    message: string;
    details: string | null;
    userId: string;
  }) {
    const existing = await this.prisma.stockAlert.findFirst({
      where: {
        companyId: params.companyId,
        unitId: params.unitId,
        productId: params.productId,
        type: params.type,
        resolved: false,
      },
    });

    if (existing) return existing;

    const alert = await this.prisma.stockAlert.create({
      data: {
        companyId: params.companyId,
        unitId: params.unitId,
        productId: params.productId,
        type: params.type,
        message: params.message,
        details: params.details,
      },
    });

    await this.notificationsService.create(params.companyId, params.userId, {
      companyId: params.companyId,
      userId: params.userId,
      type: ALERT_NOTIFICATION_TYPE_MAP[params.type],
      title: ALERT_TYPE_LABELS[params.type],
      message: params.message,
    });

    await this.auditService.create({
      companyId: params.companyId,
      userId: params.userId,
      action: 'CREATE',
      entity: 'stock_alert',
      entityId: alert.id,
      newData: alert as any,
    });

    return alert;
  }
}

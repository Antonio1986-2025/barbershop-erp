import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StockReportService {
  constructor(private readonly prisma: PrismaService) {}

  async currentStock(
    companyId: string,
    query: { unitId?: string; categoryId?: string },
  ) {
    const where: any = { companyId };
    if (query.unitId) where.unitId = query.unitId;

    if (query.categoryId) {
      where.product = { categoryId: query.categoryId };
    }

    const stocks = await this.prisma.stock.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        product: {
          select: { id: true, name: true, barcode: true, salePrice: true, costPrice: true },
        },
      },
      orderBy: [{ product: { name: 'asc' } }],
    });

    const rows = stocks.map((s) => ({
      productId: s.productId,
      productName: s.product.name,
      barcode: s.product.barcode,
      unitId: s.unitId,
      unitName: s.unit.name,
      quantity: Number(s.quantity),
      avgCost: Number(s.avgCost),
      totalValue: Number(s.quantity) * Number(s.avgCost),
    }));

    const totalValue = rows.reduce((sum, r) => sum + r.totalValue, 0);

    return { data: rows, totalValue, totalItems: rows.length };
  }

  async movements(
    companyId: string,
    query: {
      unitId?: string; productId?: string; type?: string;
      startDate?: string; endDate?: string;
      page?: number; limit?: number;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (query.unitId) where.unitId = query.unitId;
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;
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

    const rows = data.map((m) => ({
      id: m.id,
      date: m.createdAt,
      type: m.type,
      productId: m.productId,
      productName: m.product.name,
      barcode: m.product.barcode,
      unitId: m.unitId,
      unitName: m.unit.name,
      quantity: Number(m.quantity),
      unitCost: m.unitCost ? Number(m.unitCost) : null,
      totalCost: m.totalCost ? Number(m.totalCost) : null,
      balanceBefore: Number(m.balanceBefore),
      balanceAfter: Number(m.balanceAfter),
      avgCostBefore: m.avgCostBefore ? Number(m.avgCostBefore) : null,
      avgCostAfter: m.avgCostAfter ? Number(m.avgCostAfter) : null,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      description: m.description,
    }));

    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async kardex(
    companyId: string,
    productId: string,
    query: { unitId?: string; startDate?: string; endDate?: string; page?: number; limit?: number },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      select: { id: true, name: true, barcode: true, salePrice: true, costPrice: true },
    });
    if (!product) {
      return { product: null, movements: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }

    const where: any = { companyId, productId };
    if (query.unitId) where.unitId = query.unitId;
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
        orderBy: { createdAt: 'asc' },
        include: {
          unit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    const rows = data.map((m) => ({
      date: m.createdAt,
      type: m.type,
      unitId: m.unitId,
      unitName: m.unit.name,
      quantity: Number(m.quantity),
      unitCost: m.unitCost ? Number(m.unitCost) : null,
      totalCost: m.totalCost ? Number(m.totalCost) : null,
      balanceBefore: Number(m.balanceBefore),
      balanceAfter: Number(m.balanceAfter),
      avgCostBefore: m.avgCostBefore ? Number(m.avgCostBefore) : null,
      avgCostAfter: m.avgCostAfter ? Number(m.avgCostAfter) : null,
      referenceType: m.referenceType,
      description: m.description,
    }));

    return {
      product,
      movements: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async turnover(
    companyId: string,
    query: { unitId?: string; startDate?: string; endDate?: string },
  ) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const daysDiff = Math.max(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      1,
    );

    const stockWhere: any = { companyId };
    if (query.unitId) stockWhere.unitId = query.unitId;

    const stocks = await this.prisma.stock.findMany({
      where: stockWhere,
      include: {
        product: { select: { id: true, name: true, barcode: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    const productIds = stocks.map((s) => s.productId);
    const movementWhere: any = {
      companyId,
      type: { in: ['SALE', 'CONSUMPTION', 'LOSS', 'TRANSFER_OUT'] },
      createdAt: { gte: startDate, lte: endDate },
    };
    if (query.unitId) movementWhere.unitId = query.unitId;
    if (productIds.length > 0) movementWhere.productId = { in: productIds };

    const outMovements = await this.prisma.stockMovement.findMany({
      where: movementWhere,
      select: { productId: true, quantity: true },
    });

    const outByProduct: Record<string, number> = {};
    for (const m of outMovements) {
      outByProduct[m.productId] = (outByProduct[m.productId] ?? 0) + Number(m.quantity);
    }

    const rows = stocks.map((s) => {
      const totalOut = outByProduct[s.productId] ?? 0;
      const avgStock = Number(s.quantity);
      const turnoverRate = avgStock > 0 ? totalOut / avgStock : 0;
      const annualizedRate = (turnoverRate / daysDiff) * 365;

      return {
        productId: s.productId,
        productName: s.product.name,
        barcode: s.product.barcode,
        unitId: s.unitId,
        unitName: s.unit.name,
        currentStock: Number(s.quantity),
        totalOut,
        avgStock,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        annualizedRate: Math.round(annualizedRate * 100) / 100,
        daysCovered: turnoverRate > 0 ? Math.round(daysDiff / turnoverRate) : null,
      };
    });

    return { data: rows, period: { startDate, endDate, days: daysDiff } };
  }

  async valuation(companyId: string, query: { unitId?: string; categoryId?: string }) {
    const where: any = { companyId };
    if (query.unitId) where.unitId = query.unitId;
    if (query.categoryId) {
      where.product = { categoryId: query.categoryId };
    }

    const stocks = await this.prisma.stock.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        product: {
          select: { id: true, name: true, barcode: true, salePrice: true, costPrice: true },
        },
      },
    });

    const byUnit: Record<string, any> = {};
    let grandTotal = 0;

    for (const s of stocks) {
      const qty = Number(s.quantity);
      const avgCost = Number(s.avgCost);
      const costValue = qty * avgCost;
      const saleValue = qty * Number(s.product.salePrice);
      grandTotal += costValue;

      if (!byUnit[s.unitId]) {
        byUnit[s.unitId] = { unitId: s.unitId, unitName: s.unit.name, costValue: 0, saleValue: 0, itemCount: 0 };
      }
      byUnit[s.unitId].costValue += costValue;
      byUnit[s.unitId].saleValue += saleValue;
      byUnit[s.unitId].itemCount += 1;
    }

    return {
      byUnit: Object.values(byUnit).map((u: any) => ({
        ...u,
        costValue: Math.round(u.costValue * 100) / 100,
        saleValue: Math.round(u.saleValue * 100) / 100,
        potentialProfit: Math.round((u.saleValue - u.costValue) * 100) / 100,
      })),
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalItems: stocks.length,
    };
  }

  async lowStock(companyId: string, query: { unitId?: string }) {
    const where: any = { companyId, quantity: 0 };
    if (query.unitId) where.unitId = query.unitId;

    const stocks = await this.prisma.stock.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, barcode: true } },
      },
      orderBy: [{ product: { name: 'asc' } }],
    });

    return {
      data: stocks.map((s) => ({
        productId: s.productId,
        productName: s.product.name,
        barcode: s.product.barcode,
        unitId: s.unitId,
        unitName: s.unit.name,
        quantity: Number(s.quantity),
        avgCost: Number(s.avgCost),
      })),
      totalItems: stocks.length,
    };
  }

  async inactiveProducts(
    companyId: string,
    query: { unitId?: string; startDate?: string; endDate?: string },
  ) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    const stockWhere: any = { companyId };
    if (query.unitId) stockWhere.unitId = query.unitId;

    const stocks = await this.prisma.stock.findMany({
      where: stockWhere,
      include: {
        product: { select: { id: true, name: true, barcode: true, salePrice: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    const productIds = stocks.map((s) => s.productId);

    const movementWhere: any = {
      companyId,
      createdAt: { gte: startDate, lte: endDate },
    };
    if (productIds.length > 0) {
      movementWhere.productId = { in: productIds };
    }

    const activeProductIds = new Set<string>();
    const cursor = await this.prisma.stockMovement.findMany({
      where: movementWhere,
      select: { productId: true },
      distinct: ['productId'],
    });
    for (const m of cursor) {
      activeProductIds.add(m.productId);
    }

    const inactive = stocks.filter((s) => !activeProductIds.has(s.productId));

    return {
      data: inactive.map((s) => ({
        productId: s.productId,
        productName: s.product.name,
        barcode: s.product.barcode,
        unitId: s.unitId,
        unitName: s.unit.name,
        quantity: Number(s.quantity),
        avgCost: Number(s.avgCost),
        totalValue: Number(s.quantity) * Number(s.avgCost),
      })),
      period: { startDate, endDate },
      totalItems: inactive.length,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferStatus } from '@prisma/client';

const ENTRY_TYPES = ['PURCHASE', 'RETURN', 'TRANSFER_IN', 'ADJUSTMENT'];
const OUT_TYPES = ['SALE', 'CONSUMPTION', 'TRANSFER_OUT', 'LOSS'];
const IN_TRANSIT_STATUSES: TransferStatus[] = ['PENDING', 'APPROVED', 'IN_TRANSIT'];

@Injectable()
export class StockDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCards(companyId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      stocks,
      totalProducts,
      transfersInTransit,
      purchasesThisMonth,
      openAlerts,
    ] = await Promise.all([
      this.prisma.stock.findMany({
        where: { companyId },
        include: {
          product: { select: { id: true, name: true, salePrice: true } },
          unit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.count({ where: { companyId, active: true } }),
      this.prisma.transfer.count({
        where: { companyId, status: { in: IN_TRANSIT_STATUSES } },
      }),
      this.prisma.purchase.aggregate({
        where: {
          companyId,
          status: 'CONFIRMED',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.stockAlert.count({
        where: { companyId, resolved: false },
      }),
    ]);

    let totalValue = 0;
    let zeroStock = 0;
    let lowStock = 0;
    let productsWithStock = 0;

    for (const s of stocks) {
      const qty = Number(s.quantity);
      const cost = Number(s.avgCost);
      totalValue += qty * cost;

      if (qty > 0) productsWithStock++;
      if (qty === 0) zeroStock++;
      if (qty > 0 && s.minStock && qty <= Number(s.minStock)) lowStock++;
    }

    const productsWithStockIds = [
      ...new Set(stocks.filter((s) => Number(s.quantity) > 0).map((s) => s.productId)),
    ];

    const productsWithRecentMovement = await this.prisma.stockMovement.findMany({
      where: {
        companyId,
        createdAt: { gte: ninetyDaysAgo },
        productId: { in: productsWithStockIds },
      },
      select: { productId: true },
      distinct: ['productId'],
    });

    const activeProductIds = new Set(productsWithRecentMovement.map((m) => m.productId));
    const inactiveProducts = productsWithStockIds.filter((id) => !activeProductIds.has(id)).length;

    const avgTurnover = await this.computeAvgTurnover(companyId);

    const monthlyPurchases = Number(purchasesThisMonth._sum?.totalAmount ?? 0);

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      totalProducts,
      lowStock,
      zeroStock,
      inactiveProducts,
      inTransit: transfersInTransit,
      monthlyPurchases,
      avgTurnover,
      openAlerts,
    };
  }

  async getCharts(companyId: string) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [stocks, movements, products, categories] = await Promise.all([
      this.prisma.stock.findMany({
        where: { companyId },
        include: {
          product: { select: { id: true, name: true, categoryId: true } },
          unit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.stockMovement.findMany({
        where: { companyId, createdAt: { gte: twelveMonthsAgo } },
        select: {
          id: true,
          productId: true,
          unitId: true,
          type: true,
          quantity: true,
          unitCost: true,
          balanceAfter: true,
          avgCostAfter: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true, categoryId: true, costPrice: true, salePrice: true },
      }),
      this.prisma.category.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const stockMap = new Map(stocks.map((s) => [`${s.productId}:${s.unitId}`, s]));

    const valueEvolution = this.computeValueEvolution(movements);
    const inOutByMonth = this.computeInOutByMonth(movements);
    const turnoverByCategory = this.computeTurnoverByCategory(
      companyId, stocks, products, categoryMap, twelveMonthsAgo,
    );
    const topProducts = this.computeTopProducts(movements, productMap);
    const abcCurve = this.computeAbcCurve(stocks, productMap);
    const distributionByUnit = this.computeDistributionByUnit(stocks);

    return {
      valueEvolution,
      inOutByMonth,
      turnoverByCategory,
      topProducts,
      abcCurve,
      distributionByUnit,
    };
  }

  async getRankings(companyId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [stocks, movements] = await Promise.all([
      this.prisma.stock.findMany({
        where: { companyId },
        include: {
          product: { select: { id: true, name: true, barcode: true, costPrice: true, salePrice: true } },
        },
      }),
      this.prisma.stockMovement.findMany({
        where: {
          companyId,
          type: 'SALE',
          createdAt: { gte: ninetyDaysAgo },
        },
        select: { productId: true, quantity: true },
      }),
    ]);

    const productMap = new Map(stocks.map((s) => [s.productId, s.product]));
    const saleVolume: Record<string, number> = {};

    for (const m of movements) {
      saleVolume[m.productId] = (saleVolume[m.productId] ?? 0) + Number(m.quantity);
    }

    const productSales = Object.entries(saleVolume).map(([productId, totalSold]) => ({
      productId,
      productName: productMap.get(productId)?.name ?? 'Desconhecido',
      barcode: productMap.get(productId)?.barcode ?? null,
      totalSold,
    }));

    productSales.sort((a, b) => b.totalSold - a.totalSold);

    const mostSold = productSales.slice(0, 10);
    const leastSold = [...productSales].sort((a, b) => a.totalSold - b.totalSold).slice(0, 10);

    const productAgg: Record<string, { productId: string; productName: string; barcode: string | null; totalValue: number; quantity: number }> = {};

    for (const s of stocks) {
      const qty = Number(s.quantity);
      if (qty <= 0) continue;
      const value = qty * Number(s.product.costPrice);
      if (!productAgg[s.productId]) {
        productAgg[s.productId] = {
          productId: s.productId,
          productName: s.product.name,
          barcode: s.product.barcode,
          totalValue: 0,
          quantity: 0,
        };
      }
      productAgg[s.productId].totalValue += value;
      productAgg[s.productId].quantity += qty;
    }

    const highestValueParked = Object.values(productAgg)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)
      .map((p) => ({
        ...p,
        totalValue: Math.round(p.totalValue * 100) / 100,
      }));

    return { mostSold, leastSold, highestValueParked };
  }

  async getAlertsSummary(companyId: string) {
    const [total, byType, recentAlerts] = await Promise.all([
      this.prisma.stockAlert.count({ where: { companyId, resolved: false } }),
      this.prisma.stockAlert.groupBy({
        by: ['type'],
        where: { companyId, resolved: false },
        _count: { id: true },
      }),
      this.prisma.stockAlert.findMany({
        where: { companyId, resolved: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          unit: { select: { id: true, name: true } },
          product: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      byType: byType.map((b) => ({
        type: b.type,
        count: b._count.id,
      })),
      recent: recentAlerts,
    };
  }

  private async computeAvgTurnover(companyId: string): Promise<number> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const stocks = await this.prisma.stock.findMany({
      where: { companyId, quantity: { gt: 0 } },
      select: { productId: true, quantity: true, unitId: true },
    });

    if (stocks.length === 0) return 0;

    const productIds = stocks.map((s) => s.productId);

    const outMovements = await this.prisma.stockMovement.findMany({
      where: {
        companyId,
        type: { in: ['SALE', 'CONSUMPTION', 'LOSS'] },
        createdAt: { gte: twelveMonthsAgo },
        productId: { in: productIds },
      },
      select: { productId: true, quantity: true },
    });

    const outByProduct: Record<string, number> = {};
    for (const m of outMovements) {
      outByProduct[m.productId] = (outByProduct[m.productId] ?? 0) + Number(m.quantity);
    }

    let totalRate = 0;
    let count = 0;

    for (const s of stocks) {
      const totalOut = outByProduct[s.productId] ?? 0;
      const avgStock = Number(s.quantity);
      if (avgStock > 0) {
        totalRate += totalOut / avgStock;
        count++;
      }
    }

    return count > 0 ? Math.round((totalRate / count) * 100) / 100 : 0;
  }

  private computeValueEvolution(
    movements: Array<{ productId: string; unitId: string; balanceAfter: any; avgCostAfter: any; createdAt: Date }>,
  ) {
    const monthGroups: Record<string, Map<string, { balanceAfter: number; avgCostAfter: number }>> = {};

    for (const m of movements) {
      const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthGroups[key]) monthGroups[key] = new Map();

      const pk = `${m.productId}:${m.unitId}`;
      monthGroups[key].set(pk, {
        balanceAfter: Number(m.balanceAfter),
        avgCostAfter: Number(m.avgCostAfter ?? 0),
      });
    }

    const result: Array<{ month: string; value: number }> = [];

    for (const [month, productMap] of Object.entries(monthGroups)) {
      let totalValue = 0;
      for (const { balanceAfter, avgCostAfter } of productMap.values()) {
        totalValue += balanceAfter * avgCostAfter;
      }
      result.push({ month, value: Math.round(totalValue * 100) / 100 });
    }

    result.sort((a, b) => a.month.localeCompare(b.month));
    return result;
  }

  private computeInOutByMonth(
    movements: Array<{ type: string; quantity: any; createdAt: Date }>,
  ) {
    const monthGroups: Record<string, { entries: number; outs: number }> = {};

    for (const m of movements) {
      const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthGroups[key]) monthGroups[key] = { entries: 0, outs: 0 };

      const qty = Number(m.quantity);
      if (ENTRY_TYPES.includes(m.type) && m.type !== 'ADJUSTMENT') {
        monthGroups[key].entries += qty;
      } else if (OUT_TYPES.includes(m.type)) {
        monthGroups[key].outs += qty;
      } else if (m.type === 'ADJUSTMENT') {
        if (qty >= 0) monthGroups[key].entries += qty;
        else monthGroups[key].outs += Math.abs(qty);
      }
    }

    return Object.entries(monthGroups)
      .map(([month, data]) => ({
        month,
        entries: Math.round(data.entries * 100) / 100,
        outs: Math.round(data.outs * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async computeTurnoverByCategory(
    companyId: string,
    stocks: Array<{ productId: string; unitId: string; quantity: any }>,
    products: Array<{ id: string; categoryId: string | null }>,
    categoryMap: Map<string, string>,
    twelveMonthsAgo: Date,
  ) {
    const productCatMap = new Map(products.map((p) => [p.id, p.categoryId]));
    const stockByProduct: Record<string, number> = {};

    for (const s of stocks) {
      stockByProduct[s.productId] = (stockByProduct[s.productId] ?? 0) + Number(s.quantity);
    }

    const productIds = Object.keys(stockByProduct).filter((id) => stockByProduct[id] > 0);

    if (productIds.length === 0) return [];

    const outMovements = await this.prisma.stockMovement.findMany({
      where: {
        companyId,
        type: { in: ['SALE', 'CONSUMPTION', 'LOSS'] },
        createdAt: { gte: twelveMonthsAgo },
        productId: { in: productIds },
      },
      select: { productId: true, quantity: true },
    });

    const outByProduct: Record<string, number> = {};
    for (const m of outMovements) {
      outByProduct[m.productId] = (outByProduct[m.productId] ?? 0) + Number(m.quantity);
    }

    const catAgg: Record<string, { totalOut: number; totalStock: number; count: number }> = {};

    for (const pid of productIds) {
      const catId = productCatMap.get(pid);
      const catName = catId ? categoryMap.get(catId) ?? 'Sem categoria' : 'Sem categoria';
      if (!catAgg[catName]) catAgg[catName] = { totalOut: 0, totalStock: 0, count: 0 };

      catAgg[catName].totalOut += outByProduct[pid] ?? 0;
      catAgg[catName].totalStock += stockByProduct[pid] ?? 0;
      catAgg[catName].count++;
    }

    return Object.entries(catAgg)
      .map(([category, data]) => ({
        category,
        turnoverRate: data.totalStock > 0
          ? Math.round((data.totalOut / data.totalStock) * 100) / 100
          : 0,
        totalOut: data.totalOut,
        totalStock: Math.round(data.totalStock * 100) / 100,
        productCount: data.count,
      }))
      .sort((a, b) => b.turnoverRate - a.turnoverRate);
  }

  private computeTopProducts(
    movements: Array<{ productId: string; type: string; quantity: any }>,
    productMap: Map<string, { id: string; name: string }>,
  ) {
    const volume: Record<string, number> = {};

    for (const m of movements) {
      if (OUT_TYPES.includes(m.type)) {
        volume[m.productId] = (volume[m.productId] ?? 0) + Number(m.quantity);
      }
      if (m.type === 'ADJUSTMENT' && Number(m.quantity) < 0) {
        volume[m.productId] = (volume[m.productId] ?? 0) + Math.abs(Number(m.quantity));
      }
    }

    return Object.entries(volume)
      .map(([productId, totalVolume]) => ({
        productId,
        productName: productMap.get(productId)?.name ?? 'Desconhecido',
        totalVolume,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10);
  }

  private computeAbcCurve(
    stocks: Array<{ productId: string; quantity: any; unitId: string }>,
    productMap: Map<string, { id: string; name: string; costPrice: any }>,
  ) {
    const productValue: Record<string, { name: string; value: number }> = {};

    for (const s of stocks) {
      const qty = Number(s.quantity);
      if (qty <= 0) continue;
      const product = productMap.get(s.productId);
      if (!product) continue;

      const costPrice = Number(product.costPrice);
      const value = qty * costPrice;

      if (!productValue[s.productId]) {
        productValue[s.productId] = { name: product.name, value: 0 };
      }
      productValue[s.productId].value += value;
    }

    const sorted = Object.entries(productValue)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.value - a.value);

    const totalValue = sorted.reduce((sum, p) => sum + p.value, 0);
    if (totalValue === 0) return { items: [], totalValue: 0 };

    let cumulative = 0;
    const items = sorted.map((p) => {
      cumulative += p.value;
      const pct = (p.value / totalValue) * 100;
      const cumulativePct = (cumulative / totalValue) * 100;
      let classification: string;
      if (cumulativePct <= 80) classification = 'A';
      else if (cumulativePct <= 95) classification = 'B';
      else classification = 'C';

      return {
        productId: p.productId,
        productName: p.name,
        value: Math.round(p.value * 100) / 100,
        percentage: Math.round(pct * 100) / 100,
        cumulativePercentage: Math.round(cumulativePct * 100) / 100,
        classification,
      };
    });

    return { items, totalValue: Math.round(totalValue * 100) / 100 };
  }

  private computeDistributionByUnit(
    stocks: Array<{ unitId: string; unit: { name: string }; quantity: any; avgCost: any }>,
  ) {
    const unitAgg: Record<string, { unitName: string; value: number; itemCount: number }> = {};

    for (const s of stocks) {
      const qty = Number(s.quantity);
      const cost = Number(s.avgCost);
      if (!unitAgg[s.unitId]) {
        unitAgg[s.unitId] = { unitName: s.unit.name, value: 0, itemCount: 0 };
      }
      unitAgg[s.unitId].value += qty * cost;
      unitAgg[s.unitId].itemCount++;
    }

    const totalValue = Object.values(unitAgg).reduce((sum, u) => sum + u.value, 0);

    return Object.entries(unitAgg).map(([unitId, data]) => ({
      unitId,
      unitName: data.unitName,
      value: Math.round(data.value * 100) / 100,
      percentage: totalValue > 0
        ? Math.round((data.value / totalValue) * 10000) / 100
        : 0,
      itemCount: data.itemCount,
    }));
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SaleDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCards(companyId: string) {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      paidSales,
      paidSalesMonth,
      cashbackAvailable,
      cashbackUsed,
      loyaltyPoints,
      totalCustomers,
      couponUsage,
      couponCount,
    ] = await Promise.all([
      this.prisma.sale.findMany({
        where: { companyId, status: 'PAID', createdAt: { gte: dayStart } },
        select: { total: true },
      }),
      this.prisma.sale.findMany({
        where: { companyId, status: 'PAID', createdAt: { gte: monthStart, lte: monthEnd } },
        select: { total: true, discountAmount: true, customerId: true, createdAt: true },
      }),
      this.prisma.cashbackTransaction.aggregate({
        where: { companyId, status: 'AVAILABLE' },
        _sum: { amount: true },
      }),
      this.prisma.cashbackTransaction.aggregate({
        where: { companyId, status: 'USED' },
        _sum: { amount: true },
      }),
      this.prisma.loyaltyPoints.aggregate({
        where: { companyId, type: 'EARNED' },
        _sum: { points: true },
      }),
      this.prisma.customer.count({ where: { companyId } }),
      this.prisma.coupon.aggregate({
        where: { companyId },
        _sum: { usedCount: true },
      }),
      this.prisma.coupon.count({ where: { companyId, active: true } }),
    ]);

    const dailyRevenue = paidSales.reduce((s, sale) => s + Number(sale.total), 0);
    const monthlyRevenue = paidSalesMonth.reduce((s, sale) => s + Number(sale.total), 0);
    const totalSales = paidSalesMonth.length;
    const avgTicket = totalSales > 0 ? monthlyRevenue / totalSales : 0;
    const totalDiscounts = paidSalesMonth.reduce((s, sale) => s + Number(sale.discountAmount), 0);

    const uniqueCustomers = new Set(paidSalesMonth.map((s) => s.customerId).filter(Boolean));
    const returningCustomers = totalCustomers > 0 && uniqueCustomers.size > 0
      ? Math.round((uniqueCustomers.size / totalCustomers) * 100)
      : 0;

    const totalCouponUses = Number(couponUsage._sum?.usedCount ?? 0);
    const couponUsageRate = couponCount > 0
      ? Math.round((totalCouponUses / couponCount) * 100) / 100
      : 0;

    return {
      dailyRevenue: Math.round(dailyRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalSales,
      avgTicket: Math.round(avgTicket * 100) / 100,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      cashbackGranted: Math.round(Number(cashbackAvailable._sum?.amount ?? 0) * 100) / 100,
      cashbackUsed: Math.round(Number(cashbackUsed._sum?.amount ?? 0) * 100) / 100,
      loyaltyPoints: loyaltyPoints._sum?.points ?? 0,
      returningCustomers,
      couponUsageRate,
    };
  }

  async getCharts(companyId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [paidSales, payments, products, services, categories] = await Promise.all([
      this.prisma.sale.findMany({
        where: { companyId, status: 'PAID', createdAt: { gte: sixMonthsAgo } },
        select: { id: true, total: true, unitId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { companyId, saleId: { not: null }, status: 'PAID', createdAt: { gte: sixMonthsAgo } },
        select: { amount: true, paymentMethod: true, createdAt: true },
      }),
      this.prisma.product.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true, categoryId: true },
      }),
      this.prisma.service.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true },
      }),
      this.prisma.category.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const salesEvolution = this.computeSalesEvolution(paidSales);
    const salesByPaymentMethod = this.computeSalesByPaymentMethod(payments);
    const salesByCategory = await this.computeSalesByCategory(companyId, sixMonthsAgo, categoryMap);
    const topProducts = await this.computeTopProducts(companyId, sixMonthsAgo, productMap);
    const topServices = await this.computeTopServices(companyId, sixMonthsAgo, productMap);

    const byUnit: Record<string, { unitId: string; unitName: string; total: number }> = {};
    for (const sale of paidSales) {
      if (!byUnit[sale.unitId]) {
        byUnit[sale.unitId] = { unitId: sale.unitId, unitName: sale.unitId, total: 0 };
      }
      byUnit[sale.unitId].total += Number(sale.total);
    }

    const unitIds = Object.keys(byUnit);
    if (unitIds.length > 0) {
      const units = await this.prisma.unit.findMany({
        where: { id: { in: unitIds } },
        select: { id: true, name: true },
      });
      for (const u of units) {
        if (byUnit[u.id]) byUnit[u.id].unitName = u.name;
      }
    }

    const salesByUnit = Object.values(byUnit).map((u) => ({
      ...u,
      total: Math.round(u.total * 100) / 100,
    }));

    const busyHours = this.computeBusyHours(paidSales);

    return { salesEvolution, salesByPaymentMethod, salesByUnit, salesByCategory, topProducts, topServices, busyHours };
  }

  async getRankings(companyId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [saleItems, payments, coupons] = await Promise.all([
      this.prisma.saleItem.findMany({
        where: {
          sale: { companyId, status: 'PAID', createdAt: { gte: sixMonthsAgo } },
        },
        select: { productName: true, serviceName: true, productId: true, quantity: true, totalPrice: true },
      }),
      this.prisma.sale.findMany({
        where: { companyId, status: 'PAID', customerId: { not: null }, createdAt: { gte: sixMonthsAgo } },
        select: { customerId: true, total: true },
      }),
      this.prisma.coupon.findMany({
        where: { companyId, usedCount: { gt: 0 } },
        select: { code: true, usedCount: true, discountType: true, discountValue: true },
        orderBy: { usedCount: 'desc' },
        take: 10,
      }),
    ]);

    const customerAgg: Record<string, number> = {};
    for (const s of payments) {
      if (s.customerId) {
        customerAgg[s.customerId] = (customerAgg[s.customerId] ?? 0) + Number(s.total);
      }
    }

    const customerIds = Object.keys(customerAgg);
    let topCustomers: Array<{ customerId: string; customerName: string; total: number }> = [];
    if (customerIds.length > 0) {
      const customers = await this.prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true },
      });
      const custMap = new Map(customers.map((c) => [c.id, c.name]));
      topCustomers = Object.entries(customerAgg)
        .map(([id, total]) => ({ customerId: id, customerName: custMap.get(id) ?? 'Desconhecido', total: Math.round(total * 100) / 100 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    }

    const prodAgg: Record<string, { name: string; qty: number; total: number }> = {};
    const servAgg: Record<string, { name: string; qty: number; total: number }> = {};

    for (const item of saleItems) {
      if (item.productId) {
        if (!prodAgg[item.productId]) prodAgg[item.productId] = { name: item.productName, qty: 0, total: 0 };
        prodAgg[item.productId].qty += Number(item.quantity);
        prodAgg[item.productId].total += Number(item.totalPrice);
      }
      if (item.serviceName) {
        if (!servAgg[item.serviceName]) servAgg[item.serviceName] = { name: item.serviceName, qty: 0, total: 0 };
        servAgg[item.serviceName].qty += Number(item.quantity);
        servAgg[item.serviceName].total += Number(item.totalPrice);
      }
    }

    const topProducts = Object.entries(prodAgg)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const topServices = Object.entries(servAgg)
      .map(([name, data]) => ({ ...data, name }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const topCoupons = coupons.map((c) => ({
      code: c.code,
      usedCount: c.usedCount,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
    }));

    return { topCustomers, topProducts, topServices, topCoupons };
  }

  async getAlerts(companyId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [totalSales, cancelledSales, expiringCoupons, cashbackPending, openRegisters] = await Promise.all([
      this.prisma.sale.count({ where: { companyId, status: 'PAID', createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.sale.count({ where: { companyId, status: 'CANCELLED', createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.coupon.findMany({
        where: { companyId, active: true, expiresAt: { gte: now, lte: sevenDaysFromNow } },
        select: { id: true, code: true, expiresAt: true },
      }),
      this.prisma.cashbackTransaction.aggregate({
        where: { companyId, status: 'AVAILABLE' },
        _sum: { amount: true },
      }),
      this.prisma.cashRegister.findMany({
        where: { companyId, status: 'OPEN' },
        select: { id: true, unitId: true, openedAt: true },
      }),
    ]);

    const cancellationRate = totalSales > 0
      ? Math.round((cancelledSales / (totalSales + cancelledSales)) * 100)
      : 0;

    const alerts: Array<{ type: string; severity: string; message: string }> = [];

    if (cancellationRate > 20) {
      alerts.push({ type: 'high_cancellation', severity: 'high', message: `Taxa de cancelamento: ${cancellationRate}% nos últimos 30 dias` });
    }

    for (const coupon of expiringCoupons) {
      alerts.push({ type: 'expiring_coupon', severity: 'medium', message: `Cupom ${coupon.code} expira em ${coupon.expiresAt?.toLocaleDateString('pt-BR')}` });
    }

    const pendingAmount = Number(cashbackPending._sum?.amount ?? 0);
    if (pendingAmount > 1000) {
      alerts.push({ type: 'high_pending_cashback', severity: 'low', message: `Cashback pendente total: R$ ${pendingAmount.toFixed(2)}` });
    }

    for (const reg of openRegisters) {
      const hoursOpen = (now.getTime() - reg.openedAt.getTime()) / (1000 * 60 * 60);
      if (hoursOpen > 12) {
        alerts.push({ type: 'long_open_cash', severity: 'medium', message: `Caixa ${reg.unitId} aberto há ${Math.round(hoursOpen)} horas` });
      }
    }

    return { cancellationRate, alerts };
  }

  private computeSalesEvolution(paidSales: Array<{ createdAt: Date; total: any }>) {
    const monthAgg: Record<string, number> = {};
    for (const sale of paidSales) {
      const key = `${sale.createdAt.getFullYear()}-${String(sale.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthAgg[key] = (monthAgg[key] ?? 0) + Number(sale.total);
    }
    return Object.entries(monthAgg)
      .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private computeSalesByPaymentMethod(payments: Array<{ paymentMethod: string; amount: any }>) {
    const methodAgg: Record<string, number> = {};
    for (const p of payments) {
      methodAgg[p.paymentMethod] = (methodAgg[p.paymentMethod] ?? 0) + Number(p.amount);
    }
    return Object.entries(methodAgg).map(([method, total]) => ({
      method,
      total: Math.round(total * 100) / 100,
    }));
  }

  private async computeSalesByCategory(
    companyId: string,
    sixMonthsAgo: Date,
    categoryMap: Map<string, string>,
  ) {
    const items = await this.prisma.saleItem.findMany({
      where: {
        productId: { not: null },
        sale: { companyId, status: 'PAID', createdAt: { gte: sixMonthsAgo } },
      },
      select: { productId: true, totalPrice: true },
    });

    const products = await this.prisma.product.findMany({
      where: { companyId },
      select: { id: true, categoryId: true },
    });
    const prodCatMap = new Map(products.map((p) => [p.id, p.categoryId]));

    const catAgg: Record<string, number> = {};
    for (const item of items) {
      if (!item.productId) continue;
      const catId = prodCatMap.get(item.productId);
      const catName = catId ? categoryMap.get(catId) ?? 'Sem categoria' : 'Sem categoria';
      catAgg[catName] = (catAgg[catName] ?? 0) + Number(item.totalPrice);
    }

    return Object.entries(catAgg).map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
    }));
  }

  private async computeTopProducts(
    companyId: string,
    sixMonthsAgo: Date,
    productMap: Map<string, { id: string; name: string }>,
  ) {
    const items = await this.prisma.saleItem.findMany({
      where: {
        productId: { not: null },
        sale: { companyId, status: 'PAID', createdAt: { gte: sixMonthsAgo } },
      },
      select: { productId: true, quantity: true, productName: true },
    });

    const agg: Record<string, { name: string; qty: number }> = {};
    for (const item of items) {
      if (!item.productId) continue;
      if (!agg[item.productId]) agg[item.productId] = { name: item.productName, qty: 0 };
      agg[item.productId].qty += Number(item.quantity);
    }

    return Object.entries(agg)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }

  private async computeTopServices(
    companyId: string,
    sixMonthsAgo: Date,
    productMap: Map<string, { id: string; name: string }>,
  ) {
    const items = await this.prisma.saleItem.findMany({
      where: {
        serviceName: { not: null },
        sale: { companyId, status: 'PAID', createdAt: { gte: sixMonthsAgo } },
      },
      select: { serviceName: true, quantity: true },
    });

    const agg: Record<string, number> = {};
    for (const item of items) {
      if (!item.serviceName) continue;
      agg[item.serviceName] = (agg[item.serviceName] ?? 0) + Number(item.quantity);
    }

    return Object.entries(agg)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }

  private computeBusyHours(paidSales: Array<{ createdAt: Date }>) {
    const hourAgg: Record<number, number> = {};
    for (const sale of paidSales) {
      const hour = sale.createdAt.getHours();
      hourAgg[hour] = (hourAgg[hour] ?? 0) + 1;
    }
    return Object.entries(hourAgg)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
  }
}

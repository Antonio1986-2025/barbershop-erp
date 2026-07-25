import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrmDashboardQueryDto } from './dto/crm-dashboard-query.dto';

@Injectable()
export class CrmDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCards(companyId: string, query: CrmDashboardQueryDto) {
    const now = new Date();
    const periodStart = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = query.endDate ? new Date(query.endDate) : now;
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const [
      totalCustomers,
      newCustomers,
      recentBuyers,
      recentAppointments,
      cashbackAgg,
      loyaltyAgg,
      salesData,
      automationExecutions,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { companyId, active: true } }),
      this.prisma.customer.count({
        where: { companyId, active: true, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.sale.findMany({
        where: { companyId, status: 'PAID', customerId: { not: null }, createdAt: { gte: thirtyDaysAgo } },
        select: { customerId: true, total: true },
        distinct: ['customerId'],
      }),
      this.prisma.appointment.findMany({
        where: { companyId, status: 'COMPLETED', startAt: { gte: thirtyDaysAgo } },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
      this.prisma.cashbackTransaction.aggregate({
        where: { companyId, status: 'AVAILABLE' },
        _sum: { amount: true },
      }),
      this.prisma.loyaltyPoints.aggregate({
        where: { companyId, type: 'EARNED' },
        _sum: { points: true },
      }),
      this.prisma.sale.findMany({
        where: { companyId, status: 'PAID', customerId: { not: null } },
        select: { customerId: true, total: true },
      }),
      this.prisma.automationExecution.count({
        where: { eventName: { in: ['SalePaid', 'CustomerBirthday', 'CustomerInactive', 'TaskOverdue', 'CouponExpiring'] } },
      }),
    ]);

    const recentCustomerIds = new Set([
      ...recentBuyers.map((s) => s.customerId!),
      ...recentAppointments.map((a) => a.customerId!),
    ]);

    const customerTotalMap = new Map<string, number>();
    for (const s of salesData) {
      if (!s.customerId) continue;
      customerTotalMap.set(s.customerId, (customerTotalMap.get(s.customerId) ?? 0) + Number(s.total));
    }

    const customersWithPurchase = new Set(salesData.map((s) => s.customerId).filter(Boolean));
    const returned = salesData.filter((s) => s.customerId).map((s) => s.customerId!);
    const uniqueReturned = new Set(returned);
    const retentionRate = customersWithPurchase.size > 0
      ? Math.round((uniqueReturned.size / customersWithPurchase.size) * 100)
      : 0;

    const totalSpent = salesData.reduce((sum, s) => sum + Number(s.total), 0);
    const avgTicket = salesData.length > 0 ? totalSpent / salesData.length : 0;
    const avgLTV = customersWithPurchase.size > 0 ? totalSpent / customersWithPurchase.size : 0;

    const activeCustomers = recentCustomerIds.size;
    const inactiveCustomers = Math.max(0, totalCustomers - activeCustomers);

    const stocks = await this.prisma.stock.findMany({
      where: { companyId, quantity: { gt: 0 } },
      select: { productId: true, unitId: true },
    });

    return {
      totalCustomers,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      averageTicket: Math.round(avgTicket * 100) / 100,
      averageLTV: Math.round(avgLTV * 100) / 100,
      retentionRate,
      cashbackBalance: Math.round(Number(cashbackAgg._sum?.amount ?? 0) * 100) / 100,
      loyaltyPoints: loyaltyAgg._sum?.points ?? 0,
      totalAutomationExecutions: automationExecutions,
    };
  }

  async getCharts(companyId: string, query: CrmDashboardQueryDto) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [customers, paidSales, campaigns, segments] = await Promise.all([
      this.prisma.customer.findMany({
        where: { companyId, createdAt: { gte: twelveMonthsAgo } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.sale.findMany({
        where: { companyId, status: 'PAID', customerId: { not: null }, createdAt: { gte: twelveMonthsAgo } },
        select: { id: true, customerId: true, total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.campaign.findMany({
        where: { companyId },
        select: { id: true, name: true, status: true, totalRecipients: true, sentCount: true, deliveredCount: true },
        take: 10,
      }),
      this.prisma.customerSegment.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true },
      }),
    ]);

    const customerEvolution = this.buildMonthlySeries(customers.map((c) => c.createdAt));
    const purchaseFrequency = this.buildPurchaseFrequency(paidSales);

    const monthlyBuyers = new Map<string, Set<string>>();
    for (const s of paidSales) {
      const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBuyers.has(key)) monthlyBuyers.set(key, new Set());
      monthlyBuyers.get(key)!.add(s.customerId!);
    }

    const allMonths = this.getMonthKeys(twelveMonthsAgo, new Date());
    const retentionEvolution = allMonths.map((month, i) => {
      const current = monthlyBuyers.get(month)?.size ?? 0;
      const previous = i > 0 ? monthlyBuyers.get(allMonths[i - 1])?.size ?? 0 : 0;
      const rate = previous > 0 ? Math.round((current / previous) * 100) : 0;
      return { month, buyers: current, retentionRate: rate };
    });

    const inactiveEvolution = allMonths.map((month) => {
      const cutoff = new Date(month + '-01');
      cutoff.setMonth(cutoff.getMonth() - 3);
      const activeIds = new Set(
        paidSales.filter((s) => s.createdAt >= cutoff).map((s) => s.customerId!),
      );
      const total = new Set(paidSales.filter((s) => {
        const saleMonth = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`;
        return saleMonth <= month;
      }).map((s) => s.customerId!)).size;
      return { month, inactive: Math.max(0, total - activeIds.size) };
    });

    const campaignPerformance = campaigns.map((c) => ({
      name: c.name,
      status: c.status,
      totalRecipients: c.totalRecipients,
      sentCount: c.sentCount,
      deliveredCount: c.deliveredCount,
      conversionRate: c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0,
    }));

    const customerScoreDistribution = await this.computeScoreDistribution(companyId);

    return {
      customerEvolution,
      purchaseFrequency,
      retentionEvolution,
      inactiveEvolution,
      campaignPerformance,
      customerScoreDistribution,
    };
  }

  async getRankings(companyId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const paidSales = await this.prisma.sale.findMany({
      where: { companyId, status: 'PAID', customerId: { not: null }, createdAt: { gte: sixMonthsAgo } },
      select: { customerId: true, total: true },
    });

    const customerAgg = new Map<string, number>();
    for (const s of paidSales) {
      if (!s.customerId) continue;
      customerAgg.set(s.customerId, (customerAgg.get(s.customerId) ?? 0) + Number(s.total));
    }

    const sorted = [...customerAgg.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const customerIds = sorted.map(([id]) => id);
    const customers = customerIds.length > 0
      ? await this.prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];

    const customerMap = new Map(customers.map((c) => [c.id, c.name]));
    const topCustomers = sorted.map(([id, total]) => ({
      customerId: id,
      customerName: customerMap.get(id) ?? 'Desconhecido',
      totalSpent: Math.round(total * 100) / 100,
    }));

    const campaigns = await this.prisma.campaign.findMany({
      where: { companyId, sentCount: { gt: 0 } },
      select: { id: true, name: true, sentCount: true, deliveredCount: true },
      orderBy: { deliveredCount: 'desc' },
      take: 10,
    });

    const campaignConversion = campaigns.map((c) => ({
      name: c.name,
      sentCount: c.sentCount,
      deliveredCount: c.deliveredCount,
      conversionRate: c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0,
    }));

    return { topCustomers, campaignConversion };
  }

  async getAlerts(companyId: string) {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    const [vipCustomers, goldCustomers, cashbackAgg, overdueTasks, activeCampaigns, inactiveGrowth] = await Promise.all([
      this.prisma.customer.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true },
      }),
      this.prisma.customer.findMany({
        where: { companyId, active: true },
        select: { id: true, name: true },
      }),
      this.prisma.cashbackTransaction.aggregate({
        where: { companyId, status: 'AVAILABLE' },
        _sum: { amount: true },
      }),
      this.prisma.customerTask.count({
        where: { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: now } },
      }),
      this.prisma.campaign.findMany({
        where: { companyId, status: 'SENT' },
        select: { id: true, name: true, sentCount: true, deliveredCount: true },
      }),
      this.prisma.customer.count({
        where: {
          companyId, active: true,
          sales: { none: { status: 'PAID', createdAt: { gte: ninetyDaysAgo } } },
        },
      }),
    ]);

    const alerts: Array<{ type: string; severity: string; message: string }> = [];

    const lastPurchaseMap = new Map<string, Date>();
    const paidSales = await this.prisma.sale.findMany({
      where: { companyId, status: 'PAID', customerId: { in: vipCustomers.map((c) => c.id) } },
      select: { customerId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    for (const s of paidSales) {
      if (s.customerId && !lastPurchaseMap.has(s.customerId)) {
        lastPurchaseMap.set(s.customerId, s.createdAt);
      }
    }

    for (const c of vipCustomers) {
      const lastPurchase = lastPurchaseMap.get(c.id);
      if (lastPurchase && lastPurchase < sixtyDaysAgo) {
        alerts.push({ type: 'vip_inactive', severity: 'high', message: `VIP ${c.name} sem compra há mais de 60 dias` });
      }
    }

    const cashbackTotal = Number(cashbackAgg._sum?.amount ?? 0);
    if (cashbackTotal > 5000) {
      alerts.push({ type: 'high_cashback', severity: 'medium', message: `Cashback acumulado: R$ ${cashbackTotal.toFixed(2)}` });
    }

    if (overdueTasks > 10) {
      alerts.push({ type: 'overdue_tasks', severity: 'medium', message: `${overdueTasks} tarefas atrasadas` });
    }

    for (const c of activeCampaigns) {
      const rate = c.sentCount > 0 ? (c.deliveredCount / c.sentCount) : 1;
      if (rate < 0.5) {
        alerts.push({ type: 'low_conversion', severity: 'low', message: `Campanha "${c.name}" com entrega abaixo de 50%` });
      }
    }

    if (inactiveGrowth > Math.max(vipCustomers.length * 0.3, 10)) {
      alerts.push({ type: 'high_inactive', severity: 'high', message: `${inactiveGrowth} clientes inativos (acima de 30%)` });
    }

    return { alerts };
  }

  private buildMonthlySeries(dates: Date[]) {
    const counts = new Map<string, number>();
    for (const d of dates) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private buildPurchaseFrequency(sales: Array<{ customerId: string | null }>) {
    const customerCounts = new Map<string, number>();
    for (const s of sales) {
      if (!s.customerId) continue;
      customerCounts.set(s.customerId, (customerCounts.get(s.customerId) ?? 0) + 1);
    }
    const freqAgg = new Map<number, number>();
    for (const count of customerCounts.values()) {
      freqAgg.set(count, (freqAgg.get(count) ?? 0) + 1);
    }
    return [...freqAgg.entries()]
      .map(([purchases, customers]) => ({ purchases, customers }))
      .sort((a, b) => a.purchases - b.purchases);
  }

  private getMonthKeys(from: Date, to: Date): string[] {
    const keys: string[] = [];
    const current = new Date(from);
    while (current <= to) {
      keys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
      current.setMonth(current.getMonth() + 1);
    }
    return keys;
  }

  private async computeScoreDistribution(companyId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { companyId, active: true },
      select: { id: true },
    });

    const paidSales = await this.prisma.sale.findMany({
      where: { companyId, status: 'PAID', customerId: { in: customers.map((c) => c.id) } },
      select: { customerId: true, total: true },
    });

    const customerTotals = new Map<string, number>();
    for (const s of paidSales) {
      if (!s.customerId) continue;
      customerTotals.set(s.customerId, (customerTotals.get(s.customerId) ?? 0) + Number(s.total));
    }

    const buckets = { vip: 0, ouro: 0, prata: 0, bronze: 0, novo: 0 };
    for (const c of customers) {
      const totalSpent = customerTotals.get(c.id) ?? 0;
      const purchases = paidSales.filter((s) => s.customerId === c.id).length;
      const score = Math.min(totalSpent / 500, 1) * 25 +
        Math.min(totalSpent / 10000, 1) * 20 +
        Math.min(purchases / 20, 1) * 25 +
        (1 - Math.min(purchases > 0 ? 1 : 0, 1)) * 15 +
        10 + 5;

      if (score >= 80) buckets.vip++;
      else if (score >= 60) buckets.ouro++;
      else if (score >= 40) buckets.prata++;
      else if (score >= 20) buckets.bronze++;
      else buckets.novo++;
    }

    return Object.entries(buckets).map(([classification, count]) => ({ classification, count }));
  }
}

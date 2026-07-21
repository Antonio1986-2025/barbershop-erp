import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardFilter } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: { companyId: string; unitId?: string; startDate: string; endDate: string }) {
    const where: any = {
      companyId: filter.companyId,
      createdAt: {
        gte: new Date(filter.startDate),
        lte: new Date(filter.endDate),
      },
    };
    if (filter.unitId) {
      where.unitId = filter.unitId;
    }
    return where;
  }

  private buildWhereOptional(filter: { companyId: string; unitId?: string; startDate?: string; endDate?: string }) {
    const where: any = { companyId: filter.companyId };
    const createdAt: any = {};
    if (filter.startDate) createdAt.gte = new Date(filter.startDate);
    if (filter.endDate) createdAt.lte = new Date(filter.endDate);
    if (Object.keys(createdAt).length) where.createdAt = createdAt;
    if (filter.unitId) where.unitId = filter.unitId;
    return where;
  }

  async summary(filter: DashboardFilter) {
    const where = this.buildWhere(filter);

    const revenueAgg = await this.prisma.payment.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amount: true },
    });

    const appointments = await this.prisma.appointment.count({ where });

    const completedServices = await this.prisma.serviceOrder.count({
      where: { ...where, status: 'COMPLETED' },
    });

    const customersAgg = await this.prisma.serviceOrder.findMany({
      where: { ...where, status: 'COMPLETED' },
      select: { customerId: true },
      distinct: ['customerId'],
    });

    const revenue = revenueAgg._sum.amount ?? 0;
    const customers = customersAgg.length;
    const averageTicket =
      completedServices > 0 ? Number(revenue) / completedServices : 0;

    return {
      revenue: Number(revenue),
      appointments,
      completedServices,
      averageTicket: Number(averageTicket.toFixed(2)),
      customers,
    };
  }

  async financial(filter: DashboardFilter) {
    const where = this.buildWhere(filter);

    const payments = await this.prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { ...where, status: 'PAID' },
      _sum: { amount: true },
      _count: true,
    });

    const entriesAgg = await this.prisma.cashTransaction.aggregate({
      where: { ...where, type: 'ENTRY' },
      _sum: { amount: true },
    });

    const exitsAgg = await this.prisma.cashTransaction.aggregate({
      where: { ...where, type: 'EXIT' },
      _sum: { amount: true },
    });

    const entries = entriesAgg._sum.amount ?? 0;
    const exits = exitsAgg._sum.amount ?? 0;

    return {
      payments: payments.map((p) => ({
        method: p.paymentMethod,
        amount: Number(p._sum.amount),
        count: p._count,
      })),
      entries: Number(entries),
      exits: Number(exits),
      balance: Number(entries) - Number(exits),
    };
  }

  async operations(filter: DashboardFilter) {
    const where = this.buildWhere(filter);

    const appointments = await this.prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const serviceOrders = await this.prisma.serviceOrder.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return {
      appointments: appointments.map((a) => ({
        status: a.status,
        count: a._count,
      })),
      serviceOrders: serviceOrders.map((s) => ({
        status: s.status,
        count: s._count,
      })),
    };
  }

  async professionals(filter: DashboardFilter) {
    const where = this.buildWhere(filter);

    const data = await this.prisma.serviceOrder.groupBy({
      by: ['professionalId'],
      where: { ...where, status: 'COMPLETED' },
      _count: true,
      _sum: { total: true },
    });

    const professionalIds = data.map((d) => d.professionalId);
    const professionals = await this.prisma.professional.findMany({
      where: { id: { in: professionalIds } },
      select: { id: true, name: true },
    });

    const profMap = new Map(professionals.map((p) => [p.id, p.name]));

    return data.map((d) => ({
      professionalId: d.professionalId,
      name: profMap.get(d.professionalId) ?? 'Desconhecido',
      appointments: d._count,
      revenue: Number(d._sum.total),
    }));
  }

  async services(filter: DashboardFilter) {
    const where: any = {
      serviceOrder: {
        companyId: filter.companyId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(filter.startDate),
          lte: new Date(filter.endDate),
        },
      },
    };
    if (filter.unitId) {
      where.serviceOrder.unitId = filter.unitId;
    }

    const data = await this.prisma.serviceOrderItem.groupBy({
      by: ['serviceId'],
      where,
      _sum: { quantity: true, totalPrice: true },
      _count: true,
    });

    const serviceIds = data.map((d) => d.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const svcMap = new Map(services.map((s) => [s.id, s.name]));

    return data.map((d) => ({
      serviceId: d.serviceId,
      name: svcMap.get(d.serviceId) ?? 'Desconhecido',
      quantity: Number(d._sum.quantity),
      revenue: Number(d._sum.totalPrice),
      orders: d._count,
    }));
  }

  async stock(filter: DashboardFilter) {
    const where: any = {
      product: { companyId: filter.companyId },
    };
    if (filter.unitId) {
      where.unitId = filter.unitId;
    }

    const stocks = await this.prisma.stock.findMany({
      where,
      select: {
        quantity: true,
        product: { select: { id: true, name: true } },
      },
    });

    const movementsAgg = await this.prisma.stockMovement.aggregate({
      where: {
        ...where,
        createdAt: {
          gte: new Date(filter.startDate),
          lte: new Date(filter.endDate),
        },
      },
      _count: true,
    });

    const critical = stocks.filter((s) => Number(s.quantity) <= 0);

    return {
      totalProducts: stocks.length,
      totalQuantity: Number(
        stocks.reduce((acc, s) => acc + Number(s.quantity), 0),
      ),
      criticalProducts: critical.map((s) => ({
        name: s.product.name,
        quantity: Number(s.quantity),
      })),
      movements: movementsAgg._count,
    };
  }

  // ── New Analytics ──

  async overview(filter: { companyId: string; unitId?: string; startDate?: string; endDate?: string }) {
    const end = filter.endDate ? new Date(filter.endDate) : new Date();
    const start = filter.startDate ? new Date(filter.startDate) : new Date(end.getFullYear(), end.getMonth(), 1);
    const prevEnd = new Date(start);
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - 1, 1);

    const where: any = { companyId: filter.companyId, createdAt: { gte: start, lte: end } };
    const prevWhere: any = { companyId: filter.companyId, createdAt: { gte: prevStart, lte: prevEnd } };
    if (filter.unitId) { where.unitId = filter.unitId; prevWhere.unitId = filter.unitId }

    const [revenueAgg, prevRevenue, appointmentsTotal, completedAppts, activeCust, newCust] = await Promise.all([
      this.prisma.payment.aggregate({ where: { ...where, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { ...prevWhere, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.serviceOrder.groupBy({ by: ['customerId'], where: { ...where, status: 'COMPLETED' } }),
      this.prisma.customer.count({ where: { companyId: filter.companyId, createdAt: { gte: start, lte: end } } }),
    ]);

    const revenueTotal = Number(revenueAgg._sum.amount ?? 0);
    const prevRevenueTotal = Number(prevRevenue._sum.amount ?? 0);
    const revenueGrowth = prevRevenueTotal > 0 ? ((revenueTotal - prevRevenueTotal) / prevRevenueTotal) * 100 : 0;
    const cancellationRate = appointmentsTotal > 0
      ? (await this.prisma.appointment.count({ where: { ...where, status: 'CANCELED' } })) / appointmentsTotal * 100
      : 0;

    return {
      revenueTotal,
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      appointmentsTotal,
      completedAppointments: completedAppts,
      cancellationRate: Number(cancellationRate.toFixed(1)),
      averageTicket: completedAppts > 0 ? Number((revenueTotal / completedAppts).toFixed(2)) : 0,
      activeCustomers: activeCust.length,
      newCustomers: newCust,
    };
  }

  async revenueChart(filter: { companyId: string; unitId?: string; startDate?: string; endDate?: string }) {
    const end = filter.endDate ? new Date(filter.endDate) : new Date();
    const start = filter.startDate ? new Date(filter.startDate) : new Date(end.getFullYear(), end.getMonth(), 1);

    const where: any = { companyId: filter.companyId, createdAt: { gte: start, lte: end }, status: 'PAID' };
    if (filter.unitId) where.unitId = filter.unitId;

    const payments = await this.prisma.payment.findMany({
      where,
      select: { amount: true, createdAt: true, paymentMethod: true },
      orderBy: { createdAt: 'asc' },
    });

    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const groupKey = days > 90 ? 'month' : days > 31 ? 'week' : 'day';
    const groups = new Map<string, { revenue: number; payments: number }>();

    for (const p of payments) {
      const d = new Date(p.createdAt);
      let key: string;
      if (groupKey === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      else if (groupKey === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else key = p.createdAt.toISOString().slice(0, 10);

      const g = groups.get(key) ?? { revenue: 0, payments: 0 };
      g.revenue += Number(p.amount);
      g.payments++;
      groups.set(key, g);
    }

    return Array.from(groups.entries()).map(([date, data]) => ({ date, ...data }));
  }

  async topServices(filter: { companyId: string; unitId?: string; startDate?: string; endDate?: string }) {
    const where: any = {
      serviceOrder: {
        companyId: filter.companyId,
        status: 'COMPLETED',
        ...(filter.startDate || filter.endDate ? {
          createdAt: {
            ...(filter.startDate ? { gte: new Date(filter.startDate) } : {}),
            ...(filter.endDate ? { lte: new Date(filter.endDate) } : {}),
          },
        } : {}),
      },
    };
    if (filter.unitId) where.serviceOrder.unitId = filter.unitId;

    const data = await this.prisma.serviceOrderItem.groupBy({
      by: ['serviceId'], where,
      _sum: { quantity: true, totalPrice: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const svcIds = data.map(d => d.serviceId);
    const svcs = await this.prisma.service.findMany({ where: { id: { in: svcIds } }, select: { id: true, name: true } });
    const map = new Map(svcs.map(s => [s.id, s.name]));

    return data.map(d => ({
      serviceId: d.serviceId,
      name: map.get(d.serviceId) ?? 'Desconhecido',
      quantity: Number(d._sum.quantity),
      revenue: Number(d._sum.totalPrice),
    }));
  }

  async professionalsRanking(filter: { companyId: string; unitId?: string; startDate?: string; endDate?: string }) {
    const where: any = {
      companyId: filter.companyId,
      status: 'COMPLETED',
      ...(filter.startDate || filter.endDate ? {
        createdAt: {
          ...(filter.startDate ? { gte: new Date(filter.startDate) } : {}),
          ...(filter.endDate ? { lte: new Date(filter.endDate) } : {}),
        },
      } : {}),
    };
    if (filter.unitId) where.unitId = filter.unitId;

    const data = await this.prisma.serviceOrder.groupBy({
      by: ['professionalId'], where,
      _count: true,
      _sum: { total: true },
      orderBy: { _count: { professionalId: 'desc' } },
      take: 10,
    });

    const profIds = data.map(d => d.professionalId);
    const profs = await this.prisma.professional.findMany({ where: { id: { in: profIds } }, select: { id: true, name: true } });
    const map = new Map(profs.map(p => [p.id, p.name]));

    return data.map(d => ({
      professionalId: d.professionalId,
      name: map.get(d.professionalId) ?? 'Desconhecido',
      appointments: d._count,
      completed: d._count,
      revenue: Number(d._sum.total),
      averageTicket: d._count > 0 ? Number((Number(d._sum.total) / d._count).toFixed(2)) : 0,
    }));
  }

  async occupancy(filter: { companyId: string; unitId?: string; startDate?: string; endDate?: string }) {
    const start = filter.startDate ? new Date(filter.startDate) : new Date();
    const end = filter.endDate ? new Date(filter.endDate) : new Date(start.getTime() + 7 * 86400000);

    const hours = await this.prisma.businessHour.findMany({
      where: { companyId: filter.companyId, active: true },
    });

    const totalSlots = hours.reduce((sum, h) => {
      const [hS, mS] = h.startTime.split(':').map(Number);
      const [hE, mE] = h.endTime.split(':').map(Number);
      const slots = Math.floor(((hE * 60 + mE) - (hS * 60 + mS)) / 15);
      return sum + Math.max(0, slots);
    }, 0);

    const apptWhere: any = {
      companyId: filter.companyId,
      startAt: { gte: start, lt: end },
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
    };
    if (filter.unitId) apptWhere.unitId = filter.unitId;

    const occupied = await this.prisma.appointment.count({ where: apptWhere });
    const occupancyPct = totalSlots > 0 ? Number(((occupied / totalSlots) * 100).toFixed(1)) : 0;

    return {
      totalSlots,
      occupiedSlots: occupied,
      availableSlots: Math.max(0, totalSlots - occupied),
      occupancyPercentage: occupancyPct,
    };
  }

  async financialAnalysis(filter: { companyId: string; unitId?: string; startDate?: string; endDate?: string }) {
    const end = filter.endDate ? new Date(filter.endDate) : new Date();
    const start = filter.startDate ? new Date(filter.startDate) : new Date(end.getFullYear(), end.getMonth(), 1);

    const baseWhere: any = { companyId: filter.companyId };
    if (filter.unitId) baseWhere.unitId = filter.unitId;

    const [revenueAgg, entriesAgg, exitsAgg, receivableAgg, payableAgg] = await Promise.all([
      this.prisma.payment.aggregate({ where: { ...baseWhere, status: 'PAID', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
      this.prisma.cashTransaction.aggregate({ where: { ...baseWhere, type: 'ENTRY', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
      this.prisma.cashTransaction.aggregate({ where: { ...baseWhere, type: 'EXIT', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
      this.prisma.financialAccount.aggregate({ where: { ...baseWhere, type: 'RECEIVABLE', status: { not: 'CANCELLED' } }, _sum: { amount: true } }),
      this.prisma.financialAccount.aggregate({ where: { ...baseWhere, type: 'PAYABLE', status: { not: 'CANCELLED' } }, _sum: { amount: true } }),
    ]);

    const revenue = Number(revenueAgg._sum.amount ?? 0);
    const entries = Number(entriesAgg._sum.amount ?? 0);
    const exits = Number(exitsAgg._sum.amount ?? 0);
    const receivables = Number(receivableAgg._sum.amount ?? 0);
    const payables = Number(payableAgg._sum.amount ?? 0);

    return {
      revenue,
      expenses: exits,
      profit: revenue - exits,
      receivables,
      payables,
      cashBalance: entries - exits,
    };
  }

  async stockAnalysis(filter: { companyId: string; unitId?: string }) {
    const where: any = { product: { companyId: filter.companyId } };
    if (filter.unitId) where.unitId = filter.unitId;

    const stocks = await this.prisma.stock.findMany({
      where,
      select: { quantity: true, product: { select: { id: true, name: true, costPrice: true, salePrice: true } } },
    });

    const lowStockCount = stocks.filter(s => Number(s.quantity) <= 5).length;
    const stockValue = stocks.reduce((sum, s) => sum + Number(s.quantity) * Number(s.product.costPrice), 0);

    return {
      totalProducts: stocks.length,
      lowStockCount,
      stockValue: Number(stockValue.toFixed(2)),
      topMovements: stocks.filter(s => Number(s.quantity) > 0).length,
    };
  }

  async alerts(filter: { companyId: string; unitId?: string }) {
    const result: { type: string; severity: string; message: string }[] = [];

    const where: any = { product: { companyId: filter.companyId } };
    if (filter.unitId) where.unitId = filter.unitId;

    const lowStock = await this.prisma.stock.findMany({
      where: { ...where, quantity: { lte: 5 } },
      select: { quantity: true, product: { select: { name: true } } },
    });
    for (const s of lowStock) {
      result.push({ type: 'STOCK', severity: Number(s.quantity) <= 0 ? 'critical' : 'warning', message: `Estoque baixo: ${s.product.name} (${Number(s.quantity)})` });
    }

    const finWhere: any = { companyId: filter.companyId, status: 'OPEN', dueDate: { lt: new Date() } };
    const overdue = await this.prisma.financialAccount.count({ where: finWhere });
    if (overdue > 0) {
      result.push({ type: 'FINANCIAL', severity: 'critical', message: `${overdue} conta(s) vencida(s) a pagar` });
    }

    const occupancyData = await this.occupancy(filter);
    if (occupancyData.occupancyPercentage < 30) {
      result.push({ type: 'SCHEDULE', severity: 'warning', message: `Ocupação baixa: ${occupancyData.occupancyPercentage}%` });
    }

    return result;
  }
}

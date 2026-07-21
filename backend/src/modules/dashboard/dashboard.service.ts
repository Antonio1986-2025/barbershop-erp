import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardFilter } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: DashboardFilter) {
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
}

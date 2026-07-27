import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BarberService {
  constructor(private readonly prisma: PrismaService) {}

  private getProfessionalId(user: any): string {
    if (!user.professionalId) {
      throw new ForbiddenException('Usuário não possui vínculo com profissional');
    }
    return user.professionalId;
  }

  async getDashboard(companyId: string, user: any) {
    const professionalId = this.getProfessionalId(user);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [appointmentsToday, nextAppointment] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { companyId, professionalId, startAt: { gte: todayStart, lte: todayEnd } },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.appointment.findFirst({
        where: {
          companyId,
          professionalId,
          startAt: { gte: new Date() },
          status: { notIn: ['CANCELED', 'COMPLETED'] },
        },
        orderBy: { startAt: 'asc' },
        include: { customer: { select: { id: true, name: true } }, service: { select: { id: true, name: true } } },
      }),
    ]);

    // Get today's sales via service orders linked to this professional
    const todayServiceOrders = await this.prisma.serviceOrder.findMany({
      where: { companyId, professionalId, createdAt: { gte: todayStart, lte: todayEnd } },
      select: { id: true },
    });
    const todaySales = await this.prisma.sale.findMany({
      where: {
        companyId,
        serviceOrderId: { in: todayServiceOrders.map((so) => so.id), not: null },
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const completedToday = appointmentsToday.filter((a) => a.status === 'COMPLETED');
    const servicesCount = completedToday.length;
    const totalSoldToday = todaySales.reduce((sum, s) => sum + Number(s.total), 0);

    return {
      appointmentsToday: {
        total: appointmentsToday.length,
        completed: completedToday.length,
        scheduled: appointmentsToday.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length,
      },
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment.id,
            customerName: nextAppointment.customer?.name,
            serviceName: nextAppointment.service?.name,
            startAt: nextAppointment.startAt,
            status: nextAppointment.status,
          }
        : null,
      servicesToday: servicesCount,
      productsSoldToday: 0,
      totalSoldToday: Number(totalSoldToday.toFixed(2)),
    };
  }

  async getAppointments(companyId: string, user: any, query: { status?: string; startDate?: string; endDate?: string }) {
    const professionalId = this.getProfessionalId(user);
    const where: any = { companyId, professionalId };
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.startAt = {};
      if (query.startDate) where.startAt.gte = new Date(query.startDate);
      if (query.endDate) where.startAt.lte = new Date(query.endDate);
    }
    return this.prisma.appointment.findMany({
      where,
      orderBy: { startAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true } },
      },
    });
  }

  async getServiceOrders(companyId: string, user: any) {
    const professionalId = this.getProfessionalId(user);
    return this.prisma.serviceOrder.findMany({
      where: { companyId, professionalId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { service: { select: { id: true, name: true } }, product: { select: { id: true, name: true } } } },
      },
    });
  }

  async getSales(companyId: string, user: any, query: { status?: string; page?: number; limit?: number }) {
    const professionalId = this.getProfessionalId(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // Find sales via service orders linked to this professional
    const serviceOrderIds = await this.prisma.serviceOrder.findMany({
      where: { companyId, professionalId },
      select: { id: true },
    });
    const soIds = serviceOrderIds.map((so) => so.id);
    if (soIds.length === 0) {
      return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }

    const where: any = { companyId, serviceOrderId: { in: soIds } };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          serviceOrder: { select: { id: true } },
          payments: { select: { id: true, amount: true, status: true, paymentMethod: true } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCommissions(companyId: string, user: any, query: { status?: string; page?: number; limit?: number }) {
    const professionalId = this.getProfessionalId(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // Get commissions for this professional
    const where: any = { companyId, professionalId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.commission.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getProfile(companyId: string, user: any) {
    const professionalId = this.getProfessionalId(user);
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, companyId },
      include: {
        units: { include: { unit: { select: { id: true, name: true } } } },
      },
    });
    if (!professional) throw new NotFoundException('Profissional não encontrado');
    return professional;
  }
}
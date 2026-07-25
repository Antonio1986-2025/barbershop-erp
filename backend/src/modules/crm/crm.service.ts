import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSegmentDto, UpdateSegmentDto } from './dto/create-segment.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const [
      paidSales,
      appointments,
      loyaltyPoints,
      cashbackAvailable,
      tags,
    ] = await Promise.all([
      this.prisma.sale.findMany({
        where: { companyId, customerId, status: 'PAID' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, total: true, discountAmount: true, createdAt: true, items: { select: { productId: true, serviceName: true } } },
      }),
      this.prisma.appointment.findMany({
        where: { companyId, customerId },
        orderBy: { startAt: 'desc' },
        select: { id: true, startAt: true, status: true, service: { select: { name: true } } },
      }),
      this.prisma.loyaltyPoints.aggregate({
        where: { companyId, customerId, type: 'EARNED' },
        _sum: { points: true },
      }),
      this.prisma.cashbackTransaction.aggregate({
        where: { companyId, customerId, status: 'AVAILABLE' },
        _sum: { amount: true },
      }),
      this.prisma.customerTagAssignment.findMany({
        where: { customerId },
        include: { tag: { select: { id: true, name: true, color: true } } },
      }),
    ]);

    const segments = await this.computeCustomerSegments(companyId, customer, paidSales, appointments);

    const totalPurchases = paidSales.length;
    const totalSpent = paidSales.reduce((s, sale) => s + Number(sale.total), 0);
    const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

    const productSales = paidSales.filter((s) => s.items.some((i) => i.productId));
    const serviceSales = paidSales.filter((s) => s.items.some((i) => i.serviceName));
    const totalProducts = productSales.length;
    const totalServices = serviceSales.length;

    const highestPurchase = paidSales.length > 0
      ? Math.max(...paidSales.map((s) => Number(s.total)))
      : 0;

    const completedAppts = appointments.filter((a) => a.status === 'COMPLETED');
    const cancelledAppts = appointments.filter((a) => a.status === 'CANCELED');
    const totalAppointments = appointments.length;
    const cancellationRate = totalAppointments > 0
      ? Math.round((cancelledAppts.length / totalAppointments) * 100) / 100
      : 0;

    const lastAppointment = completedAppts[0] ?? null;
    const nextAppointment = appointments.find((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED') ?? null;

    const lastSale = paidSales[0] ?? null;
    const firstSale = paidSales[paidSales.length - 1] ?? null;

    const daysSinceLastPurchase = lastSale
      ? Math.floor((Date.now() - lastSale.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const daysSinceLastAppointment = lastAppointment
      ? Math.floor((Date.now() - lastAppointment.startAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let relationshipStatus = 'NEW';
    if (totalPurchases > 0) {
      relationshipStatus = daysSinceLastPurchase !== null && daysSinceLastPurchase > 180
        ? 'INACTIVE' : 'ACTIVE';
    }

    const customerScore = this.computeScore({
      totalPurchases, totalSpent, averageTicket, highestPurchase,
      daysSinceLastPurchase, totalAppointments, cancellationRate,
      loyaltyPoints: loyaltyPoints._sum?.points ?? 0,
      cashbackBalance: Number(cashbackAvailable._sum?.amount ?? 0),
    });

    return {
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
      finance: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        averageTicket: Math.round(averageTicket * 100) / 100,
        highestPurchase: Math.round(highestPurchase * 100) / 100,
        totalPurchases,
        totalProducts,
        totalServices,
      },
      appointments: {
        total: totalAppointments,
        completed: completedAppts.length,
        cancelled: cancelledAppts.length,
        cancellationRate,
        lastAppointment: lastAppointment
          ? { date: lastAppointment.startAt, service: lastAppointment.service?.name ?? null }
          : null,
        nextAppointment: nextAppointment
          ? { date: nextAppointment.startAt, service: nextAppointment.service?.name ?? null }
          : null,
      },
      loyalty: {
        points: loyaltyPoints._sum?.points ?? 0,
        cashbackBalance: Number(cashbackAvailable._sum?.amount ?? 0),
        customerSince: firstSale?.createdAt ?? null,
        daysSinceLastPurchase,
        daysSinceLastAppointment,
      },
      relationship: {
        score: customerScore,
        status: relationshipStatus,
        segments: segments,
        tags: tags.map((t) => t.tag),
      },
    };
  }

  async getSegments(companyId: string) {
    return this.prisma.customerSegment.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findSegment(companyId: string, id: string) {
    const seg = await this.prisma.customerSegment.findFirst({ where: { id, companyId } });
    if (!seg) throw new NotFoundException('Segmento não encontrado');
    return seg;
  }

  async createSegment(companyId: string, dto: CreateSegmentDto) {
    return this.prisma.customerSegment.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        rules: JSON.stringify(dto.rules),
        color: dto.color,
      },
    });
  }

  async updateSegment(companyId: string, id: string, dto: UpdateSegmentDto) {
    await this.findSegment(companyId, id);
    const data: any = { ...dto };
    if (dto.rules) data.rules = JSON.stringify(dto.rules);
    return this.prisma.customerSegment.update({ where: { id }, data });
  }

  async deleteSegment(companyId: string, id: string) {
    await this.findSegment(companyId, id);
    await this.prisma.customerSegment.update({ where: { id }, data: { active: false } });
  }

  async getCustomerSegments(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, companyId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const [paidSales, appointments] = await Promise.all([
      this.prisma.sale.findMany({
        where: { companyId, customerId, status: 'PAID' },
        select: { total: true, createdAt: true, items: { select: { productId: true } } },
      }),
      this.prisma.appointment.findMany({
        where: { companyId, customerId },
        select: { startAt: true, status: true },
      }),
    ]);

    return this.computeCustomerSegments(companyId, customer, paidSales, appointments);
  }

  private getRules(rulesJson: string): Array<{ field: string; operator: string; value: any; periodDays?: number }> {
    try {
      return JSON.parse(rulesJson);
    } catch {
      return [];
    }
  }

  private async computeCustomerSegments(
    companyId: string,
    customer: any,
    paidSales: any[],
    appointments: any[],
  ) {
    const segments = await this.prisma.customerSegment.findMany({
      where: { companyId, active: true },
    });

    const totalPurchases = paidSales.length;
    const totalSpent = paidSales.reduce((s, sale) => s + Number(sale.total), 0);
    const avgTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    const lastSale = paidSales[0] ?? null;
    const daysSinceLastPurchase = lastSale
      ? Math.floor((Date.now() - lastSale.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 9999;
    const completedAppts = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelledAppts = appointments.filter((a) => a.status === 'CANCELED').length;
    const totalAppts = appointments.length;
    const cancellationRate = totalAppts > 0 ? cancelledAppts / totalAppts : 0;
    const birthMonth = customer.birthDate ? customer.birthDate.getMonth() + 1 : null;
    const currentMonth = new Date().getMonth() + 1;

    const matched: string[] = [];

    for (const seg of segments) {
      const rules = this.getRules(seg.rules);
      let allMatch = true;

      for (const rule of rules) {
        let fieldValue: any;
        switch (rule.field) {
          case 'totalSpent': fieldValue = totalSpent; break;
          case 'totalPurchases': fieldValue = totalPurchases; break;
          case 'averageTicket': fieldValue = avgTicket; break;
          case 'daysSinceLastPurchase': fieldValue = daysSinceLastPurchase; break;
          case 'cancellationRate': fieldValue = cancellationRate; break;
          case 'completedAppointments': fieldValue = completedAppts; break;
          case 'birthMonth': fieldValue = birthMonth; break;
          default: fieldValue = null;
        }

        if (fieldValue === null) { allMatch = false; break; }

        switch (rule.operator) {
          case 'gte': if (!(fieldValue >= rule.value)) allMatch = false; break;
          case 'gt':  if (!(fieldValue > rule.value)) allMatch = false; break;
          case 'lte': if (!(fieldValue <= rule.value)) allMatch = false; break;
          case 'lt':  if (!(fieldValue < rule.value)) allMatch = false; break;
          case 'eq':  if (!(fieldValue === rule.value)) allMatch = false; break;
          case 'birthMonth': if (rule.value === 'current' && fieldValue !== currentMonth) allMatch = false; break;
          default: allMatch = false;
        }

        if (!allMatch) break;
      }

      if (allMatch) matched.push(seg.name);
    }

    return matched;
  }

  private computeScore(params: {
    totalPurchases: number;
    totalSpent: number;
    averageTicket: number;
    highestPurchase: number;
    daysSinceLastPurchase: number | null;
    totalAppointments: number;
    cancellationRate: number;
    loyaltyPoints: number;
    cashbackBalance: number;
  }): number {
    const weights = { frequency: 0.25, ticket: 0.20, total: 0.20, recency: 0.15, cancellation: 0.10, cashback: 0.05, loyalty: 0.05 };

    const freqScore = Math.min(params.totalPurchases / 20, 1) * 100;
    const ticketScore = params.averageTicket > 0 ? Math.min(params.averageTicket / 500, 1) * 100 : 0;
    const totalScore = Math.min(params.totalSpent / 10000, 1) * 100;
    const recencyScore = params.daysSinceLastPurchase !== null
      ? Math.max(0, 100 - params.daysSinceLastPurchase)
      : 0;
    const cancellationScore = (1 - params.cancellationRate) * 100;
    const cashbackScore = Math.min(params.cashbackBalance / 500, 1) * 100;
    const loyaltyScore = Math.min(params.loyaltyPoints / 1000, 1) * 100;

    const score = Math.round(
      freqScore * weights.frequency +
      ticketScore * weights.ticket +
      totalScore * weights.total +
      recencyScore * weights.recency +
      cancellationScore * weights.cancellation +
      cashbackScore * weights.cashback +
      loyaltyScore * weights.loyalty
    );

    return Math.min(Math.max(score, 0), 100);
  }
}

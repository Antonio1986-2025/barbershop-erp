import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId: string, filter: NotificationFilterDto) {
    const page = Math.max(1, parseInt(filter.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(filter.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;
    if (filter.channel) where.channel = filter.channel;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true } },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const result = await this.prisma.notification.findFirst({
      where: { id, companyId },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
    if (!result) throw new NotFoundException('Notificação não encontrada');
    return result;
  }

  async create(companyId: string, userId: string | undefined, dto: CreateNotificationDto) {
    const result = await this.prisma.notification.create({
      data: {
        companyId: dto.companyId,
        userId: dto.userId,
        customerId: dto.customerId,
        type: dto.type as any,
        channel: (dto.channel ?? 'INTERNAL') as any,
        title: dto.title,
        message: dto.message,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        metadata: dto.metadata,
      },
    });
    if (userId) {
      await this.auditService.create({ companyId, userId, action: 'CREATE', entity: 'Notification', entityId: result.id, newData: result as any });
    }
    return result;
  }

  async markAsRead(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    if (old.readAt) return old;

    const result = await this.prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    });
    await this.auditService.create({ companyId, userId, action: 'UPDATE', entity: 'Notification', entityId: id, oldData: old as any, newData: result as any });
    return result;
  }

  async countUnread(companyId: string) {
    return this.prisma.notification.count({
      where: { companyId, status: { not: 'READ' } },
    });
  }

  async send(id: string) {
    // Future: dispatch to channel adapters (WhatsApp, Email, SMS, Push)
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });
  }

  async schedule(data: {
    companyId: string;
    userId?: string;
    customerId?: string;
    type: string;
    title: string;
    message: string;
    scheduledAt: Date;
    metadata?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        customerId: data.customerId,
        type: data.type as any,
        channel: 'INTERNAL',
        title: data.title,
        message: data.message,
        status: 'PENDING',
        scheduledAt: data.scheduledAt,
        metadata: data.metadata,
      },
    });
  }

  async createFromAppointment(companyId: string, appointment: any, type: string) {
    const promises: Promise<any>[] = [];

    const titleMap: Record<string, string> = {
      APPOINTMENT_CREATED: 'Novo Agendamento',
      APPOINTMENT_CONFIRMED: 'Agendamento Confirmado',
      APPOINTMENT_CANCELLED: 'Agendamento Cancelado',
      APPOINTMENT_RESCHEDULED: 'Agendamento Reagendado',
      APPOINTMENT_REMINDER: 'Lembrete de Atendimento',
    };

    const title = titleMap[type] ?? 'Notificação de Agendamento';
    const dateStr = new Date(appointment.startAt).toLocaleString('pt-BR');

    const messageMap: Record<string, string> = {
      APPOINTMENT_CREATED: `Agendamento criado para ${appointment.customer?.name ?? 'cliente'} em ${dateStr} - ${appointment.service?.name ?? ''}`,
      APPOINTMENT_CONFIRMED: `Agendamento de ${appointment.customer?.name ?? 'cliente'} para ${dateStr} foi confirmado`,
      APPOINTMENT_CANCELLED: `Agendamento de ${appointment.customer?.name ?? 'cliente'} para ${dateStr} foi cancelado`,
      APPOINTMENT_RESCHEDULED: `Agendamento de ${appointment.customer?.name ?? 'cliente'} foi reagendado para ${dateStr}`,
      APPOINTMENT_REMINDER: `Lembrete: você tem um agendamento em ${dateStr}`,
    };

    const message = messageMap[type] ?? '';

    promises.push(
      this.prisma.notification.create({
        data: {
          companyId,
          userId: appointment.createdBy ?? undefined,
          customerId: appointment.customerId,
          type: type as any,
          channel: 'INTERNAL',
          title,
          message,
        },
      }),
    );

    if (appointment.professional) {
      promises.push(
        this.prisma.notification.create({
          data: {
            companyId,
            userId: appointment.professionalId,
            type: type as any,
            channel: 'INTERNAL',
            title,
            message,
          },
        }),
      );
    }

    return Promise.all(promises);
  }
}

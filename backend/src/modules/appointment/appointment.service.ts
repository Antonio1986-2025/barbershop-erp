import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto, RescheduleAppointmentDto } from './dto/cancel-reschedule.dto';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(companyId: string, filter: AppointmentFilterDto) {
    const where: any = { companyId, deletedAt: null };
    if (filter.unitId) where.unitId = filter.unitId;
    if (filter.professionalId) where.professionalId = filter.professionalId;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.status) where.status = filter.status;
    if (filter.startDate || filter.endDate) {
      where.startAt = {};
      if (filter.startDate) where.startAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.startAt.lt = new Date(filter.endDate);
    }
    return this.prisma.appointment.findMany({
      where,
      orderBy: { startAt: 'desc' },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        unit: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const result = await this.prisma.appointment.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        unit: { select: { id: true, name: true } },
      },
    });
    if (!result) throw new NotFoundException('Agendamento não encontrado');
    return result;
  }

  async create(companyId: string, userId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({ where: { id: dto.serviceId, companyId } });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const startAt = new Date(dto.startAt);
    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60000);

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        companyId,
        professionalId: dto.professionalId,
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        deletedAt: null,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) throw new BadRequestException('Conflito de horário com outro agendamento');

    const result = await this.prisma.appointment.create({
      data: {
        companyId,
        unitId: dto.unitId,
        professionalId: dto.professionalId,
        customerId: dto.customerId,
        serviceId: dto.serviceId,
        startAt,
        endAt,
        notes: dto.notes,
        status: 'SCHEDULED',
        createdBy: userId,
      },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
    await this.auditService.create({ companyId, userId, action: 'CREATE', entity: 'Appointment', entityId: result.id, newData: result as any });
    this.notificationsService.createFromAppointment(companyId, result, 'APPOINTMENT_CREATED').catch(() => {});
    return result;
  }

  async update(companyId: string, id: string, userId: string, dto: UpdateAppointmentDto) {
    const old = await this.findOne(companyId, id);
    const data: any = { ...dto };
    if (dto.startAt) {
      const service = await this.prisma.service.findUnique({ where: { id: old.serviceId } });
      const startAt = new Date(dto.startAt);
      data.endAt = new Date(startAt.getTime() + (service?.durationMinutes ?? 60) * 60000);
      data.startAt = startAt;
    }
    const result = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
    await this.auditService.create({ companyId, userId, action: 'UPDATE', entity: 'Appointment', entityId: id, oldData: old as any, newData: result as any });
    return result;
  }

  async cancel(companyId: string, id: string, userId: string, dto: CancelAppointmentDto) {
    const old = await this.findOne(companyId, id);
    if (old.status === 'CANCELED' || old.status === 'COMPLETED') {
      throw new BadRequestException(`Agendamento já está ${old.status === 'CANCELED' ? 'cancelado' : 'concluído'}`);
    }
    const result = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELED', cancellationReason: dto.reason, cancelledAt: new Date(), cancelledBy: userId },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
    await this.auditService.create({ companyId, userId, action: 'UPDATE', entity: 'Appointment', entityId: id, oldData: old as any, newData: result as any });
    this.notificationsService.createFromAppointment(companyId, result, 'APPOINTMENT_CANCELLED').catch(() => {});
    return result;
  }

  async reschedule(companyId: string, id: string, userId: string, dto: RescheduleAppointmentDto) {
    const old = await this.findOne(companyId, id);
    if (old.status === 'CANCELED' || old.status === 'COMPLETED') {
      throw new BadRequestException(`Não é possível reagendar um agendamento ${old.status === 'CANCELED' ? 'cancelado' : 'concluído'}`);
    }

    const newStartAt = new Date(dto.newStartAt);
    const service = await this.prisma.service.findUnique({ where: { id: old.serviceId } });
    const newEndAt = new Date(newStartAt.getTime() + (service?.durationMinutes ?? 60) * 60000);

    const newAppointment = await this.prisma.appointment.create({
      data: {
        companyId: old.companyId,
        unitId: old.unitId,
        professionalId: old.professionalId,
        customerId: old.customerId,
        serviceId: old.serviceId,
        startAt: newStartAt,
        endAt: newEndAt,
        status: 'SCHEDULED',
        notes: old.notes,
        createdBy: userId,
        rescheduledFromId: old.id,
      },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });

    await this.prisma.appointment.update({
      where: { id: old.id },
      data: {
        status: 'CANCELED',
        cancellationReason: dto.reason ?? `Reagendado para ${newStartAt.toISOString()}`,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Appointment', entityId: old.id,
      oldData: { status: old.status } as any,
      newData: { status: 'CANCELED', reason: 'Rescheduled' } as any,
    });

    this.notificationsService.createFromAppointment(companyId, newAppointment, 'APPOINTMENT_RESCHEDULED').catch(() => {});
    return newAppointment;
  }

  async softRemove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    await this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.auditService.create({ companyId, userId, action: 'DELETE', entity: 'Appointment', entityId: id, oldData: old as any });
  }

  async updateStatus(companyId: string, id: string, userId: string, status: string) {
    const old = await this.findOne(companyId, id);
    const result = await this.prisma.appointment.update({
      where: { id },
      data: { status: status as any },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
    await this.auditService.create({ companyId, userId, action: 'UPDATE', entity: 'Appointment', entityId: id, oldData: old as any, newData: result as any });
    if (status === 'CONFIRMED') {
      this.notificationsService.createFromAppointment(companyId, result, 'APPOINTMENT_CONFIRMED').catch(() => {});
    }
    return result;
  }

  async findByDateRange(companyId: string, startDate: string, endDate: string, unitId?: string, professionalId?: string) {
    const where: any = {
      companyId,
      deletedAt: null,
      startAt: { gte: new Date(startDate), lt: new Date(endDate) },
    };
    if (unitId) where.unitId = unitId;
    if (professionalId) where.professionalId = professionalId;
    return this.prisma.appointment.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        unit: { select: { id: true, name: true } },
      },
    });
  }
}

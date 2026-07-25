import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { CustomerService } from '../customer/customer.service';
import { PhoneService } from '../customer/phone.service';
import { SaleService } from '../sale/sale.service';
import { InteractionService } from '../interaction/interaction.service';
import { AutomationService } from '../automation/automation.service';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  CancelAppointmentDto,
  RescheduleAppointmentDto,
} from './dto/cancel-reschedule.dto';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly integrationsService: IntegrationsService,
    private readonly customerService: CustomerService,
    private readonly saleService: SaleService,
    private readonly phoneService: PhoneService,
    private readonly interactionService: InteractionService,
    private readonly automationService: AutomationService,
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
        service: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
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
        service: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        unit: { select: { id: true, name: true } },
      },
    });
    if (!result) throw new NotFoundException('Agendamento não encontrado');
    return result;
  }

  async create(companyId: string, userId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, companyId },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    // 🔹 Criar cliente se newCustomerName foi informado (com busca por telefone)
    let customerId = dto.customerId;
    if (dto.newCustomerName && dto.newCustomerPhone) {
      // Primeiro: buscar por telefone para evitar duplicidade
      const existing = await this.customerService.findByPhone(companyId, dto.newCustomerPhone).catch(() => null);
      if (existing) {
        customerId = existing.id;
      } else {
        const newCustomer = await this.customerService.create(companyId, userId, {
          name: dto.newCustomerName,
          phone: dto.newCustomerPhone,
        });
        customerId = newCustomer.id;
      }
    } else if (dto.newCustomerName && !dto.newCustomerPhone) {
      throw new BadRequestException('Informe o telefone do novo cliente');
    }

    if (!customerId) {
      throw new BadRequestException('Informe um cliente ou o nome do novo cliente');
    }

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
    if (conflict)
      throw new BadRequestException(
        'Conflito de horário com outro agendamento',
      );

    const result = await this.prisma.appointment.create({
      data: {
        companyId,
        unitId: dto.unitId,
        professionalId: dto.professionalId,
        customerId,
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
        service: { select: { id: true, name: true, price: true } },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: result.id,
      newData: result as any,
    });

    this.notificationsService
      .createFromAppointment(companyId, result, 'APPOINTMENT_CREATED')
      .catch(() => {});
    this.interactionService
      .create(companyId, userId, {
        customerId,
        appointmentId: result.id,
        type: 'NOTE',
        subject: 'Agendamento criado',
        description: `Agendamento para ${result.service?.name ?? 'serviço'} em ${new Date(result.startAt).toLocaleDateString('pt-BR')}`,
        interactionAt: new Date().toISOString(),
      })
      .catch(() => {});
    this.syncCalendarEvent(companyId, result, 'create').catch(() => {});

    // 🔹 Abrir comanda (venda) automática se solicitado
    if (dto.createSale !== false) {
      try {
        const price = Number((result.service as any)?.price ?? 0);
        await this.saleService.create(
          companyId,
          userId,
          {
            unitId: dto.unitId,
            customerId,
            notes: `Comanda gerada do agendamento #${result.id.slice(0, 8)}`,
            items: [
              {
                serviceId: dto.serviceId,
                quantity: 1,
                unitPrice: price,
              },
            ],
          },
        );
      } catch (err) {
        // falha ao criar comanda não quebra o agendamento
        console.error('Erro ao criar comanda:', err);
      }
    }

    return result;
  }

  // ... rest stays the same
  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateAppointmentDto,
  ) {
    const old = await this.findOne(companyId, id);
    const data: any = { ...dto };
    if (dto.startAt) {
      const service = await this.prisma.service.findUnique({
        where: { id: old.serviceId },
      });
      const startAt = new Date(dto.startAt);
      data.endAt = new Date(
        startAt.getTime() + (service?.durationMinutes ?? 60) * 60000,
      );
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
    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });
    this.syncCalendarEvent(companyId, result, 'update').catch(() => {});
    return result;
  }

  async cancel(
    companyId: string,
    id: string,
    userId: string,
    dto: CancelAppointmentDto,
  ) {
    const old = await this.findOne(companyId, id);
    if (old.status === 'CANCELED' || old.status === 'COMPLETED') {
      throw new BadRequestException(
        `Agendamento já está ${old.status === 'CANCELED' ? 'cancelado' : 'concluído'}`,
      );
    }
    const result = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELED',
        cancellationReason: dto.reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
      include: {
        professional: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });
    this.notificationsService
      .createFromAppointment(companyId, result, 'APPOINTMENT_CANCELLED')
      .catch(() => {});
    this.syncCalendarEvent(companyId, result, 'delete').catch(() => {});
    return result;
  }

  async reschedule(
    companyId: string,
    id: string,
    userId: string,
    dto: RescheduleAppointmentDto,
  ) {
    const old = await this.findOne(companyId, id);
    if (old.status === 'CANCELED' || old.status === 'COMPLETED') {
      throw new BadRequestException(
        `Não é possível reagendar um agendamento ${old.status === 'CANCELED' ? 'cancelado' : 'concluído'}`,
      );
    }

    const newStartAt = new Date(dto.newStartAt);
    const service = await this.prisma.service.findUnique({
      where: { id: old.serviceId },
    });
    const newEndAt = new Date(
      newStartAt.getTime() + (service?.durationMinutes ?? 60) * 60000,
    );

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
        cancellationReason:
          dto.reason ?? `Reagendado para ${newStartAt.toISOString()}`,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: old.id,
      oldData: { status: old.status } as any,
      newData: { status: 'CANCELED', reason: 'Rescheduled' } as any,
    });

    this.notificationsService
      .createFromAppointment(
        companyId,
        newAppointment,
        'APPOINTMENT_RESCHEDULED',
      )
      .catch(() => {});
    return newAppointment;
  }

  async softRemove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    await this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Appointment',
      entityId: id,
      oldData: old as any,
    });
  }

  async updateStatus(
    companyId: string,
    id: string,
    userId: string,
    status: string,
  ) {
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
    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });
    if (status === 'CONFIRMED') {
      this.notificationsService
        .createFromAppointment(companyId, result, 'APPOINTMENT_CONFIRMED')
        .catch(() => {});
    }

    if (status === 'COMPLETED' && result.customerId) {
      this.interactionService
        .create(companyId, userId, {
          customerId: result.customerId,
          appointmentId: id,
          type: 'VISIT',
          subject: 'Atendimento concluído',
          description: `Atendimento de ${result.service?.name ?? 'serviço'} concluído`,
          interactionAt: new Date().toISOString(),
        })
        .catch(() => {});
      this.automationService
        .onAppointmentCompleted(companyId, result.customerId, id, userId)
        .catch(() => {});
    }

    return result;
  }

  async findByDateRange(
    companyId: string,
    startDate: string,
    endDate: string,
    unitId?: string,
    professionalId?: string,
  ) {
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
        service: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        unit: { select: { id: true, name: true } },
      },
    });
  }

  private async syncCalendarEvent(companyId: string, appointment: any, action: 'create' | 'update' | 'delete') {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { companyId, provider: 'google_calendar', active: true },
      });
      if (!integration) return;

      const eventData = {
        externalId: appointment.externalCalendarId ?? undefined,
        title: `${appointment.service?.name ?? 'Atendimento'} - ${appointment.customer?.name ?? ''}`,
        description: `Profissional: ${appointment.professional?.name ?? ''}\nCliente: ${appointment.customer?.name ?? ''}`,
        start: appointment.startAt,
        end: appointment.endAt,
        attendeeEmail: appointment.customer?.email ?? undefined,
      };

      const result = await this.integrationsService.syncCalendarEvent(companyId, integration.id, action, eventData);

      if ((result?.created || result?.updated) && result?.eventId) {
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { externalCalendarId: result.eventId, externalProvider: 'google_calendar' },
        });
      }
    } catch {
      // falha na sincronização não quebra o agendamento
    }
  }
}

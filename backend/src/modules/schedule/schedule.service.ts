import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import type {
  UpdateBusinessHourDto,
  UpdateScheduleBlockDto,
} from './dto/update.dto';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ── Business Hours ──

  async findBusinessHours(companyId: string, unitId?: string) {
    const where: any = { companyId };
    if (unitId) where.unitId = unitId;
    return this.prisma.businessHour.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createBusinessHour(
    companyId: string,
    userId: string,
    dto: CreateBusinessHourDto,
  ) {
    const result = await this.prisma.businessHour.create({
      data: { ...dto, companyId },
    });
    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'BusinessHour',
      entityId: result.id,
      newData: result as any,
    });
    return result;
  }

  async updateBusinessHour(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateBusinessHourDto,
  ) {
    const old = await this.prisma.businessHour.findFirst({
      where: { id, companyId },
    });
    if (!old) throw new NotFoundException('Horário não encontrado');
    const result = await this.prisma.businessHour.update({
      where: { id },
      data: dto,
    });
    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'BusinessHour',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });
    return result;
  }

  async removeBusinessHour(companyId: string, id: string, userId: string) {
    const old = await this.prisma.businessHour.findFirst({
      where: { id, companyId },
    });
    if (!old) throw new NotFoundException('Horário não encontrado');
    await this.prisma.businessHour.delete({ where: { id } });
    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'BusinessHour',
      entityId: id,
      oldData: old as any,
    });
  }

  // ── Schedule Blocks ──

  async findBlocks(
    companyId: string,
    unitId?: string,
    professionalId?: string,
  ) {
    const where: any = { companyId };
    if (unitId) where.unitId = unitId;
    if (professionalId) where.professionalId = professionalId;
    return this.prisma.scheduleBlock.findMany({
      where,
      orderBy: { startAt: 'desc' },
      include: { professional: { select: { id: true, name: true } } },
    });
  }

  async createBlock(
    companyId: string,
    userId: string,
    dto: CreateScheduleBlockDto,
  ) {
    const result = await this.prisma.scheduleBlock.create({
      data: {
        unitId: dto.unitId,
        professionalId: dto.professionalId,
        title: dto.title,
        reason: dto.reason,
        type: (dto.type as any) ?? 'UNIT',
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        createdBy: userId,
        companyId,
      },
      include: { professional: { select: { id: true, name: true } } },
    });
    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'ScheduleBlock',
      entityId: result.id,
      newData: result as any,
    });
    return result;
  }

  async updateBlock(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateScheduleBlockDto,
  ) {
    const old = await this.prisma.scheduleBlock.findFirst({
      where: { id, companyId },
    });
    if (!old) throw new NotFoundException('Bloqueio não encontrado');
    const data: any = { ...dto };
    if (dto.startAt) data.startAt = new Date(dto.startAt);
    if (dto.endAt) data.endAt = new Date(dto.endAt);
    const result = await this.prisma.scheduleBlock.update({
      where: { id },
      data,
      include: { professional: { select: { id: true, name: true } } },
    });
    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'ScheduleBlock',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });
    return result;
  }

  async removeBlock(companyId: string, id: string, userId: string) {
    const old = await this.prisma.scheduleBlock.findFirst({
      where: { id, companyId },
    });
    if (!old) throw new NotFoundException('Bloqueio não encontrado');
    await this.prisma.scheduleBlock.delete({ where: { id } });
    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'ScheduleBlock',
      entityId: id,
      oldData: old as any,
    });
  }

  // ── Availability ──

  async getAvailability(
    companyId: string,
    unitId: string,
    date: string,
    professionalId?: string,
    serviceId?: string,
  ) {
    const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay();
    const targetDate = new Date(date + 'T12:00:00Z');

    // 0. Check if date is a holiday
    const dayStart = new Date(date + 'T00:00:00Z');
    const dayEnd = new Date(date + 'T23:59:59Z');
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        companyId,
        date: { gte: dayStart, lt: dayEnd },
      },
    });
    if (holiday) {
      return {
        date, available: false, slots: [],
        reason: `Feriado: ${holiday.name}`,
      };
    }

    // 0b. Check if professional has an absence on this date
    if (professionalId) {
      const absence = await this.prisma.professionalAbsence.findFirst({
        where: {
          companyId,
          professionalId,
          startDate: { lte: targetDate },
          endDate: { gte: targetDate },
        },
      });
      if (absence) {
        const typeLabels: Record<string, string> = {
          VACATION: 'Férias', DAY_OFF: 'Folga', BLOCKED: 'Bloqueado', SICK_LEAVE: 'Afastado',
        };
        return {
          date, available: false, slots: [],
          reason: `Profissional ${typeLabels[absence.type] ?? 'ausente'} (${absence.reason ?? 'sem motivo informado'})`,
        };
      }
    }

    // 1. Find business hours (unit-level)
    const unitHours = await this.prisma.businessHour.findMany({
      where: { companyId, unitId, professionalId: null, dayOfWeek, active: true },
    });

    if (unitHours.length === 0)
      return {
        date, available: false, slots: [],
        reason: 'A unidade não abre neste dia',
      };

    // 2. If professional is specified, check professional-specific hours
    let effectiveHours = unitHours;
    if (professionalId) {
      const profHours = await this.prisma.businessHour.findMany({
        where: { companyId, unitId, professionalId, dayOfWeek, active: true },
      });
      if (profHours.length > 0) {
        effectiveHours = profHours;
      }
    }

    // 3. Fetch blocks
    const blocks = await this.prisma.scheduleBlock.findMany({
      where: {
        companyId,
        unitId,
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
        ...(professionalId ? { professionalId } : {}),
      },
    });

    // 4. Fetch existing appointments
    const appointments = await this.prisma.appointment.findMany({
      where: {
        companyId,
        unitId,
        ...(professionalId ? { professionalId } : {}),
        startAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        deletedAt: null,
      },
      select: { startAt: true, endAt: true },
    });

    // 5. Determine service duration
    let duration = 60;
    if (serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        select: { durationMinutes: true },
      });
      if (service) duration = service.durationMinutes;
    }

    // 6. Generate slots for each period
    const slots: string[] = [];
    const interval = 15; // minutes between slot starts
    let reason = '';

    for (const h of effectiveHours) {
      const [hStart, mStart] = h.startTime.split(':').map(Number);
      const [hEnd, mEnd] = h.endTime.split(':').map(Number);
      const periodStart = hStart * 60 + mStart;
      const periodEnd = hEnd * 60 + mEnd;

      // Check if service fits at all in this period
      if (duration > periodEnd - periodStart) {
        reason = `O serviço selecionado (${duration} min) não cabe no expediente disponível (${h.startTime}-${h.endTime})`;
        continue;
      }

      for (let m = periodStart; m + duration <= periodEnd; m += interval) {
        const slotStart = new Date(
          `${date}T${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00Z`,
        );
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // Check block conflicts
        const blocked = blocks.some(
          (b) => slotStart < b.endAt && slotEnd > b.startAt,
        );
        if (blocked) continue;

        // Check appointment conflicts
        const conflicted = appointments.some(
          (a) => slotStart < a.endAt && slotEnd > a.startAt,
        );
        if (conflicted) {
          if (!reason) reason = 'Existe outro atendimento neste horário';
          continue;
        }

        slots.push(slotStart.toISOString());
      }
    }

    if (slots.length === 0 && !reason) {
      reason = 'Todos os horários estão ocupados';
    }

    return { date, available: slots.length > 0, slots, reason: reason || undefined };
  }
}

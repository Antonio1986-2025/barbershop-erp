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
    const dayOfWeek = new Date(date).getDay();

    const hours = await this.prisma.businessHour.findMany({
      where: { companyId, unitId, dayOfWeek, active: true },
    });

    if (hours.length === 0)
      return {
        date,
        available: false,
        slots: [],
        reason: 'Unidade não abre neste dia',
      };

    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const blocks = await this.prisma.scheduleBlock.findMany({
      where: {
        companyId,
        unitId,
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
        ...(professionalId ? { professionalId } : {}),
      },
    });

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

    let duration = 60;
    if (serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        select: { durationMinutes: true },
      });
      if (service) duration = service.durationMinutes;
    }

    const slots: string[] = [];
    for (const h of hours) {
      const [hStart, mStart] = h.startTime.split(':').map(Number);
      const [hEnd, mEnd] = h.endTime.split(':').map(Number);
      const startMin = hStart * 60 + mStart;
      const endMin = hEnd * 60 + mEnd;

      for (let m = startMin; m + duration <= endMin; m += 15) {
        const slotStart = new Date(
          `${date}T${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00Z`,
        );
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        const blocked = blocks.some(
          (b) => slotStart < b.endAt && slotEnd > b.startAt,
        );
        if (blocked) continue;

        const conflicted = appointments.some(
          (a) => slotStart < a.endAt && slotEnd > a.startAt,
        );
        if (conflicted) continue;

        slots.push(slotStart.toISOString());
      }
    }

    return { date, available: slots.length > 0, slots };
  }
}

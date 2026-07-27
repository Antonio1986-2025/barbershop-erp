import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { CreateAbsenceDto, UpdateAbsenceDto } from './dto/absence.dto';

@Injectable()
export class WorkScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ── Holidays ──

  async findHolidays(companyId: string) {
    return this.prisma.holiday.findMany({
      where: { companyId },
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(companyId: string, userId: string, dto: CreateHolidayDto) {
    const date = new Date(dto.date);

    // Check for duplicate date
    const existing = await this.prisma.holiday.findUnique({
      where: { companyId_date: { companyId, date } },
    });
    if (existing) {
      throw new ConflictException(`Já existe um feriado para ${dto.date}`);
    }

    const result = await this.prisma.holiday.create({
      data: { companyId, date, name: dto.name, recurring: dto.recurring ?? false },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'Holiday',
      entityId: result.id, newData: result as any,
    });

    return result;
  }

  async updateHoliday(companyId: string, id: string, userId: string, dto: UpdateHolidayDto) {
    const old = await this.prisma.holiday.findFirst({ where: { id, companyId } });
    if (!old) throw new NotFoundException('Feriado não encontrado');

    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);

    const result = await this.prisma.holiday.update({ where: { id }, data });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Holiday',
      entityId: id, oldData: old as any, newData: result as any,
    });

    return result;
  }

  async removeHoliday(companyId: string, id: string, userId: string) {
    const old = await this.prisma.holiday.findFirst({ where: { id, companyId } });
    if (!old) throw new NotFoundException('Feriado não encontrado');

    await this.prisma.holiday.delete({ where: { id } });

    await this.auditService.create({
      companyId, userId, action: 'DELETE', entity: 'Holiday',
      entityId: id, oldData: old as any,
    });
  }

  // ── Professional Absences ──

  async findAbsences(companyId: string, professionalId?: string) {
    const where: any = { companyId };
    if (professionalId) where.professionalId = professionalId;
    return this.prisma.professionalAbsence.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: { professional: { select: { id: true, name: true } } },
    });
  }

  async createAbsence(companyId: string, userId: string, dto: CreateAbsenceDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('Data final não pode ser anterior à data inicial');
    }

    // Check professional exists
    const prof = await this.prisma.professional.findFirst({
      where: { id: dto.professionalId, companyId },
    });
    if (!prof) throw new NotFoundException('Profissional não encontrado');

    // Check for overlapping absences
    const overlapping = await this.prisma.professionalAbsence.findFirst({
      where: {
        companyId,
        professionalId: dto.professionalId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlapping) {
      throw new ConflictException('Já existe uma ausência neste período para este profissional');
    }

    const result = await this.prisma.professionalAbsence.create({
      data: {
        companyId,
        professionalId: dto.professionalId,
        type: dto.type,
        startDate: start,
        endDate: end,
        reason: dto.reason,
        createdBy: userId,
      },
      include: { professional: { select: { id: true, name: true } } },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'ProfessionalAbsence',
      entityId: result.id, newData: { professionalId: dto.professionalId, type: dto.type } as any,
    });

    return result;
  }

  async updateAbsence(companyId: string, id: string, userId: string, dto: UpdateAbsenceDto) {
    const old = await this.prisma.professionalAbsence.findFirst({ where: { id, companyId } });
    if (!old) throw new NotFoundException('Ausência não encontrada');

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    const result = await this.prisma.professionalAbsence.update({ where: { id }, data });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'ProfessionalAbsence',
      entityId: id, oldData: old as any, newData: result as any,
    });

    return result;
  }

  async removeAbsence(companyId: string, id: string, userId: string) {
    const old = await this.prisma.professionalAbsence.findFirst({ where: { id, companyId } });
    if (!old) throw new NotFoundException('Ausência não encontrada');

    await this.prisma.professionalAbsence.delete({ where: { id } });

    await this.auditService.create({
      companyId, userId, action: 'DELETE', entity: 'ProfessionalAbsence',
      entityId: id, oldData: old as any,
    });
  }
}

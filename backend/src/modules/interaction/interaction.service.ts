import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInteractionDto, InteractionFilterDto } from './dto/create-interaction.dto';

@Injectable()
export class InteractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId: string, filter: InteractionFilterDto) {
    const page = Math.max(1, parseInt(filter.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(filter.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.type) where.type = filter.type;
    if (filter.campaignId) where.campaignId = filter.campaignId;
    if (filter.saleId) where.saleId = filter.saleId;
    if (filter.createdBy) where.createdBy = filter.createdBy;
    if (filter.startDate || filter.endDate) {
      where.interactionAt = {};
      if (filter.startDate) where.interactionAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.interactionAt.lte = new Date(filter.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.customerInteraction.findMany({
        where, skip, take: limit,
        orderBy: { interactionAt: 'desc' },
        include: { customer: { select: { id: true, name: true } } },
      }),
      this.prisma.customerInteraction.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(companyId: string, id: string) {
    const item = await this.prisma.customerInteraction.findFirst({
      where: { id, companyId },
      include: { customer: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException('Interação não encontrada');
    return item;
  }

  async create(companyId: string, userId: string, dto: CreateInteractionDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const result = await this.prisma.customerInteraction.create({
      data: {
        companyId,
        customerId: dto.customerId,
        campaignId: dto.campaignId,
        appointmentId: dto.appointmentId,
        saleId: dto.saleId,
        type: dto.type as any,
        subject: dto.subject,
        description: dto.description,
        metadata: dto.metadata,
        interactionAt: dto.interactionAt ? new Date(dto.interactionAt) : new Date(),
        createdBy: userId,
      },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'CustomerInteraction', entityId: result.id,
      newData: { customerId: dto.customerId, type: dto.type, subject: dto.subject } as any,
    });

    return result;
  }

  async update(companyId: string, id: string, userId: string, data: { subject?: string; description?: string }) {
    const old = await this.findOne(companyId, id);

    const result = await this.prisma.customerInteraction.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'CustomerInteraction', entityId: id,
      oldData: old as any, newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    await this.prisma.customerInteraction.delete({ where: { id } });
    await this.auditService.create({
      companyId, userId, action: 'DELETE', entity: 'CustomerInteraction', entityId: id,
      oldData: old as any,
    });
  }
}

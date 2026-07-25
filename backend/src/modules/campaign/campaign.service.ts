import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.campaign.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        segment: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, companyId },
      include: {
        segment: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async create(companyId: string, userId: string, dto: CreateCampaignDto) {
    if (dto.segmentId) {
      const seg = await this.prisma.customerSegment.findFirst({
        where: { id: dto.segmentId, companyId },
      });
      if (!seg) throw new BadRequestException('Segmento não encontrado');
    }

    const result = await this.prisma.campaign.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        type: dto.type as any,
        segmentId: dto.segmentId,
        messageTemplate: dto.messageTemplate,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        createdBy: userId,
      },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'Campaign', entityId: result.id,
      newData: { name: dto.name, type: dto.type } as any,
    });

    return result;
  }

  async update(companyId: string, id: string, userId: string, dto: UpdateCampaignDto) {
    const old = await this.findOne(companyId, id);

    if (old.status !== 'DRAFT') {
      throw new BadRequestException('Apenas campanhas em rascunho podem ser editadas');
    }

    if (dto.segmentId) {
      const seg = await this.prisma.customerSegment.findFirst({
        where: { id: dto.segmentId, companyId },
      });
      if (!seg) throw new BadRequestException('Segmento não encontrado');
    }

    const data: any = { ...dto };
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);

    const result = await this.prisma.campaign.update({ where: { id }, data });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Campaign', entityId: id,
      oldData: old as any, newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);

    if (old.status !== 'DRAFT') {
      throw new BadRequestException('Apenas campanhas em rascunho podem ser removidas');
    }

    await this.prisma.campaign.delete({ where: { id } });

    await this.auditService.create({
      companyId, userId, action: 'DELETE', entity: 'Campaign', entityId: id,
      oldData: old as any,
    });
  }

  async addRecipients(companyId: string, id: string, userId: string, customerIds: string[]) {
    const campaign = await this.findOne(companyId, id);

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Apenas campanhas em rascunho podem receber destinatários');
    }

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds }, companyId },
      select: { id: true },
    });

    if (customers.length !== customerIds.length) {
      throw new BadRequestException('Um ou mais clientes não encontrados');
    }

    const created: any[] = [];
    for (const customerId of customerIds) {
      try {
        const r = await this.prisma.campaignRecipient.create({
          data: { campaignId: id, customerId },
        });
        created.push(r);
      } catch {
        // duplicate skip
      }
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { totalRecipients: { increment: created.length } },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Campaign', entityId: id,
      newData: { addedRecipients: created.length } as any,
    });

    return created;
  }

  async addRecipientsFromSegment(companyId: string, id: string, userId: string) {
    const campaign = await this.findOne(companyId, id);

    if (!campaign.segmentId) {
      throw new BadRequestException('Campanha não possui segmento definido');
    }

    const seg = await this.prisma.customerSegment.findFirst({
      where: { id: campaign.segmentId, companyId, active: true },
    });
    if (!seg) throw new BadRequestException('Segmento não encontrado ou inativo');

    const customers = await this.prisma.customer.findMany({
      where: { companyId, active: true },
      select: { id: true },
    });

    return this.addRecipients(companyId, id, userId, customers.map((c) => c.id));
  }

  async getRecipients(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.campaignRecipient.findMany({
      where: { campaignId: id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

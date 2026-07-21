import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class CompanySettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findOne(companyId: string) {
    let settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await this.prisma.companySettings.create({
        data: { companyId },
      });
    }

    return settings;
  }

  async update(companyId: string, userId: string, dto: UpdateCompanySettingsDto) {
    const old = await this.findOne(companyId);

    const updated = await this.prisma.companySettings.update({
      where: { companyId },
      data: {
        ...dto,
        allowOnlineScheduling: dto.allowOnlineScheduling ?? undefined,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'CompanySettings',
      entityId: updated.id,
      oldData: old as any,
      newData: updated as any,
    });

    return updated;
  }
}

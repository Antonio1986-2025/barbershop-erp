import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuditService } from './audit.service';
import { AuditFilterDto } from './dto/audit-filter.dto';
import type { Request } from 'express';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('audit.view')
  async findAll(@Query() query: AuditFilterDto, @Req() req: Request) {
    const companyId = (req as any).user.companyId;
    return this.auditService.findAll(companyId, {
      page: query.page,
      limit: query.limit,
      entity: query.entity,
      action: query.action,
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }
}

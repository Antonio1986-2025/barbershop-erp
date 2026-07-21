import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('company-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanySettingsController {
  constructor(private readonly service: CompanySettingsService) {}

  @Get()
  @Permissions('company_settings.view')
  async findOne(@Request() req: any) {
    return this.service.findOne(req.user.companyId);
  }

  @Patch()
  @Permissions('company_settings.update')
  async update(@Body() dto: UpdateCompanySettingsDto, @Request() req: any) {
    return this.service.update(req.user.companyId, req.user.id, dto);
  }
}

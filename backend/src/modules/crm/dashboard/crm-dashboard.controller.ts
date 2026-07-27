import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { CrmDashboardService } from './crm-dashboard.service';
import { CrmDashboardQueryDto } from './dto/crm-dashboard-query.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/dashboard')
export class CrmDashboardController {
  constructor(private readonly crmDashboardService: CrmDashboardService) {}

  @Get('cards')
  @Permissions('customers.view')
  getCards(@Request() req: any, @Query() query: CrmDashboardQueryDto) {
    return this.crmDashboardService.getCards(req.user.companyId, query);
  }

  @Get('charts')
  @Permissions('customers.view')
  getCharts(@Request() req: any, @Query() query: CrmDashboardQueryDto) {
    return this.crmDashboardService.getCharts(req.user.companyId, query);
  }

  @Get('rankings')
  @Permissions('customers.view')
  getRankings(@Request() req: any) {
    return this.crmDashboardService.getRankings(req.user.companyId);
  }

  @Get('alerts')
  @Permissions('customers.view')
  getAlerts(@Request() req: any) {
    return this.crmDashboardService.getAlerts(req.user.companyId);
  }
}

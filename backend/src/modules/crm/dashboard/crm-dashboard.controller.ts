import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { CrmDashboardService } from './crm-dashboard.service';
import { CrmDashboardQueryDto } from './dto/crm-dashboard-query.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('crm/dashboard')
export class CrmDashboardController {
  constructor(private readonly crmDashboardService: CrmDashboardService) {}

  @Get('cards')
  getCards(@Request() req: any, @Query() query: CrmDashboardQueryDto) {
    return this.crmDashboardService.getCards(req.user.companyId, query);
  }

  @Get('charts')
  getCharts(@Request() req: any, @Query() query: CrmDashboardQueryDto) {
    return this.crmDashboardService.getCharts(req.user.companyId, query);
  }

  @Get('rankings')
  getRankings(@Request() req: any) {
    return this.crmDashboardService.getRankings(req.user.companyId);
  }

  @Get('alerts')
  getAlerts(@Request() req: any) {
    return this.crmDashboardService.getAlerts(req.user.companyId);
  }
}

import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { SaleDashboardService } from './sale-dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sales/dashboard')
export class SaleDashboardController {
  constructor(private readonly saleDashboardService: SaleDashboardService) {}

  @Get('cards')
  getCards(@Request() req: any) {
    return this.saleDashboardService.getCards(req.user.companyId);
  }

  @Get('charts')
  getCharts(@Request() req: any) {
    return this.saleDashboardService.getCharts(req.user.companyId);
  }

  @Get('rankings')
  getRankings(@Request() req: any) {
    return this.saleDashboardService.getRankings(req.user.companyId);
  }

  @Get('alerts')
  getAlerts(@Request() req: any) {
    return this.saleDashboardService.getAlerts(req.user.companyId);
  }
}

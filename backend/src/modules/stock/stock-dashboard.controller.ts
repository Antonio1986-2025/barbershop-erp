import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { StockDashboardService } from './stock-dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('stock.view')
@Controller('stock/dashboard')
export class StockDashboardController {
  constructor(private readonly stockDashboardService: StockDashboardService) {}

  @Get('cards')
  getCards(@Request() req: any) {
    return this.stockDashboardService.getCards(req.user.companyId);
  }

  @Get('charts')
  getCharts(@Request() req: any) {
    return this.stockDashboardService.getCharts(req.user.companyId);
  }

  @Get('rankings')
  getRankings(@Request() req: any) {
    return this.stockDashboardService.getRankings(req.user.companyId);
  }

  @Get('alerts')
  getAlerts(@Request() req: any) {
    return this.stockDashboardService.getAlertsSummary(req.user.companyId);
  }
}

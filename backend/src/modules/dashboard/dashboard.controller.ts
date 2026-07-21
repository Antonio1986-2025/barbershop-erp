import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilter } from './dto/dashboard-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private extractFilter(req: any, query: any) {
    return {
      companyId: req.user.companyId,
      unitId: query.unitId || undefined,
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
    };
  }

  @Get('summary')
  @Permissions('dashboard.view')
  summary(@Request() req: any, @Query() query: any) {
    return this.dashboardService.summary(this.extractFilter(req, query));
  }

  @Get('financial')
  @Permissions('dashboard.view')
  financial(@Request() req: any, @Query() query: any) {
    return this.dashboardService.financial(this.extractFilter(req, query));
  }

  @Get('operations')
  @Permissions('dashboard.view')
  operations(@Request() req: any, @Query() query: any) {
    return this.dashboardService.operations(this.extractFilter(req, query));
  }

  @Get('professionals')
  @Permissions('dashboard.view')
  professionals(@Request() req: any, @Query() query: any) {
    return this.dashboardService.professionals(this.extractFilter(req, query));
  }

  @Get('services')
  @Permissions('dashboard.view')
  services(@Request() req: any, @Query() query: any) {
    return this.dashboardService.services(this.extractFilter(req, query));
  }

  @Get('stock')
  @Permissions('dashboard.view')
  stock(@Request() req: any, @Query() query: any) {
    return this.dashboardService.stock(this.extractFilter(req, query));
  }

  // ── New Analytics Endpoints ──

  @Get('overview')
  @Permissions('dashboard.analytics')
  overview(@Request() req: any, @Query() query: any) {
    return this.dashboardService.overview(this.extractFilter(req, query));
  }

  @Get('revenue-chart')
  @Permissions('dashboard.analytics')
  revenueChart(@Request() req: any, @Query() query: any) {
    return this.dashboardService.revenueChart(this.extractFilter(req, query));
  }

  @Get('top-services')
  @Permissions('dashboard.analytics')
  topServices(@Request() req: any, @Query() query: any) {
    return this.dashboardService.topServices(this.extractFilter(req, query));
  }

  @Get('professionals-ranking')
  @Permissions('dashboard.analytics')
  professionalsRanking(@Request() req: any, @Query() query: any) {
    return this.dashboardService.professionalsRanking(this.extractFilter(req, query));
  }

  @Get('occupancy')
  @Permissions('dashboard.analytics')
  occupancy(@Request() req: any, @Query() query: any) {
    return this.dashboardService.occupancy(this.extractFilter(req, query));
  }

  @Get('financial-analysis')
  @Permissions('dashboard.analytics')
  financialAnalysis(@Request() req: any, @Query() query: any) {
    return this.dashboardService.financialAnalysis(this.extractFilter(req, query));
  }

  @Get('stock-analysis')
  @Permissions('dashboard.analytics')
  stockAnalysis(@Request() req: any, @Query() query: any) {
    return this.dashboardService.stockAnalysis(this.extractFilter(req, query));
  }

  @Get('alerts')
  @Permissions('dashboard.analytics')
  alerts(@Request() req: any, @Query() query: any) {
    return this.dashboardService.alerts(this.extractFilter(req, query));
  }
}

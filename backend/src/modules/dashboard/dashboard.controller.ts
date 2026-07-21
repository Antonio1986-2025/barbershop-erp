import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilter } from './dto/dashboard-filter.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@Query() filter: DashboardFilter) {
    return this.dashboardService.summary(filter);
  }

  @Get('financial')
  financial(@Query() filter: DashboardFilter) {
    return this.dashboardService.financial(filter);
  }

  @Get('operations')
  operations(@Query() filter: DashboardFilter) {
    return this.dashboardService.operations(filter);
  }

  @Get('professionals')
  professionals(@Query() filter: DashboardFilter) {
    return this.dashboardService.professionals(filter);
  }

  @Get('services')
  services(@Query() filter: DashboardFilter) {
    return this.dashboardService.services(filter);
  }

  @Get('stock')
  stock(@Query() filter: DashboardFilter) {
    return this.dashboardService.stock(filter);
  }
}

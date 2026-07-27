import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { BarberService } from './barber.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('barber')
export class BarberController {
  constructor(private readonly barberService: BarberService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.barberService.getDashboard(req.user.companyId, req.user);
  }

  @Get('appointments')
  getAppointments(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.barberService.getAppointments(req.user.companyId, req.user, { status, startDate, endDate });
  }

  @Get('service-orders')
  getServiceOrders(@Request() req: any) {
    return this.barberService.getServiceOrders(req.user.companyId, req.user);
  }

  @Get('sales')
  getSales(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.barberService.getSales(req.user.companyId, req.user, { status, page, limit });
  }

  @Get('commissions')
  getCommissions(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.barberService.getCommissions(req.user.companyId, req.user, { status, page, limit });
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.barberService.getProfile(req.user.companyId, req.user);
  }
}
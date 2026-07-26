import { Controller, Get, Post, Param, Query, Body, Request, UseGuards } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('commission')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  @Permissions('commission.view')
  findAll(
    @Request() req: any,
    @Query('professionalId') professionalId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commissionService.findAll(req.user.companyId, {
      professionalId,
      status,
      page,
      limit,
    });
  }

  @Post('calculate/:saleId')
  @Permissions('commission.view')
  calculate(@Request() req: any, @Param('saleId') saleId: string) {
    return this.commissionService.calculateForSale(req.user.companyId, saleId);
  }

  @Post('cancel/:saleId')
  @Permissions('commission.view')
  cancel(@Request() req: any, @Param('saleId') saleId: string, @Query('reason') reason: string) {
    return this.commissionService.cancelForSale(req.user.companyId, saleId, reason || 'Manual cancellation');
  }

  @Post(':id/approve')
  @Permissions('commission.approve')
  approve(@Request() req: any, @Param('id') id: string) {
    return this.commissionService.approve(req.user.companyId, id, req.user.id);
  }

  @Post(':id/reject')
  @Permissions('commission.approve')
  reject(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
    return this.commissionService.reject(req.user.companyId, id, req.user.id, reason);
  }

  @Post('close-period')
  @Permissions('commission.approve')
  closePeriod(@Request() req: any, @Body() dto: any) {
    return this.commissionService.closePeriod(req.user.companyId, dto.unitId, req.user.id, dto);
  }

  @Get('closings')
  @Permissions('commission.view')
  findAllClosings(@Request() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.commissionService.findAllClosings(req.user.companyId, { page, limit });
  }
}

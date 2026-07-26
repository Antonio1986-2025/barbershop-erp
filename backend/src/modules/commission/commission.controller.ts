import { Controller, Get, Post, Param, Query, Request, UseGuards } from '@nestjs/common';
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
}

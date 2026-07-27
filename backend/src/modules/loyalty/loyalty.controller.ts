import { Controller, Get, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('config')
  @Permissions('financial.view')
  getConfig(@Request() req: any) {
    return this.loyaltyService.getConfig(req.user.companyId);
  }

  @Patch('config')
  @Permissions('financial.update')
  updateConfig(@Request() req: any, @Body() body: any) {
    return this.loyaltyService.updateConfig(req.user.companyId, req.user.id, body);
  }

  @Get('balance/:customerId')
  @Permissions('financial.view')
  getBalance(@Request() req: any, @Param('customerId') customerId: string) {
    return this.loyaltyService.getBalance(req.user.companyId, customerId);
  }

  @Get('history/:customerId')
  @Permissions('financial.view')
  history(@Request() req: any, @Param('customerId') customerId: string) {
    return this.loyaltyService.history(req.user.companyId, customerId);
  }
}

import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { CashbackService } from './cashback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cashback')
export class CashbackController {
  constructor(private readonly cashbackService: CashbackService) {}

  @Get('balance/:customerId')
  @Permissions('financial.view')
  getBalance(@Request() req: any, @Param('customerId') customerId: string) {
    return this.cashbackService.getBalance(req.user.companyId, customerId);
  }

  @Get('history/:customerId')
  @Permissions('financial.view')
  history(@Request() req: any, @Param('customerId') customerId: string) {
    return this.cashbackService.history(req.user.companyId, customerId);
  }
}

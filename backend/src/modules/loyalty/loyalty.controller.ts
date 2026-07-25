import { Controller, Get, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('config')
  getConfig(@Request() req: any) {
    return this.loyaltyService.getConfig(req.user.companyId);
  }

  @Patch('config')
  updateConfig(@Request() req: any, @Body() body: any) {
    return this.loyaltyService.updateConfig(req.user.companyId, req.user.id, body);
  }

  @Get('balance/:customerId')
  getBalance(@Request() req: any, @Param('customerId') customerId: string) {
    return this.loyaltyService.getBalance(req.user.companyId, customerId);
  }

  @Get('history/:customerId')
  history(@Request() req: any, @Param('customerId') customerId: string) {
    return this.loyaltyService.history(req.user.companyId, customerId);
  }
}

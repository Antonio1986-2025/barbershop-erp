import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { CashbackService } from './cashback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cashback')
export class CashbackController {
  constructor(private readonly cashbackService: CashbackService) {}

  @Get('balance/:customerId')
  getBalance(@Request() req: any, @Param('customerId') customerId: string) {
    return this.cashbackService.getBalance(req.user.companyId, customerId);
  }

  @Get('history/:customerId')
  history(@Request() req: any, @Param('customerId') customerId: string) {
    return this.cashbackService.history(req.user.companyId, customerId);
  }
}

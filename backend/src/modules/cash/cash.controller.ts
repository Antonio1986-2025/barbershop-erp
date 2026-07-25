import {
  Controller, Get, Post,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { CashService } from './cash.service';
import { OpenCashDto } from './dto/open-cash.dto';
import { CloseCashDto } from './dto/close-cash.dto';
import { CashTransactionDto } from './dto/cash-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('current')
  current(@Request() req: any, @Query('unitId') unitId: string) {
    return this.cashService.current(req.user.companyId, unitId);
  }

  @Post('open')
  open(@Request() req: any, @Body() dto: OpenCashDto) {
    return this.cashService.open(req.user.companyId, req.user.id, dto);
  }

  @Post(':id/close')
  close(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CloseCashDto,
  ) {
    return this.cashService.close(req.user.companyId, id, req.user.id, dto);
  }

  @Post(':id/reopen')
  reopen(@Request() req: any, @Param('id') id: string) {
    return this.cashService.reopen(req.user.companyId, id, req.user.id);
  }

  @Post(':id/supply')
  supply(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CashTransactionDto,
  ) {
    return this.cashService.supply(req.user.companyId, id, req.user.id, dto);
  }

  @Post(':id/withdraw')
  withdraw(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CashTransactionDto,
  ) {
    return this.cashService.withdraw(req.user.companyId, id, req.user.id, dto);
  }

  @Get(':id/summary')
  summary(@Request() req: any, @Param('id') id: string) {
    return this.cashService.summary(req.user.companyId, id);
  }

  @Get('history')
  history(
    @Request() req: any,
    @Query('unitId') unitId?: string,
  ) {
    return this.cashService.history(req.user.companyId, unitId);
  }
}

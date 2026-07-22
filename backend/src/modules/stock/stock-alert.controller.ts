import {
  Controller, Get, Post, Patch,
  Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { StockAlertService } from './stock-alert.service';
import { StockAlertQueryDto } from './dto/stock-alert-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock/alerts')
export class StockAlertController {
  constructor(private readonly stockAlertService: StockAlertService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: StockAlertQueryDto) {
    return this.stockAlertService.findAll(req.user.companyId, query);
  }

  @Get('count/open')
  countOpen(@Request() req: any) {
    return this.stockAlertService.countOpen(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.stockAlertService.findOne(req.user.companyId, id);
  }

  @Patch(':id/resolve')
  resolve(@Request() req: any, @Param('id') id: string) {
    return this.stockAlertService.resolve(req.user.companyId, id, req.user.id);
  }

  @Post('check')
  checkAll(@Request() req: any) {
    return this.stockAlertService.checkAll(req.user.companyId, req.user.id);
  }

  @Post('check/inactive')
  checkInactive(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    const d = days ? parseInt(days, 10) : 90;
    return this.stockAlertService.checkInactiveProducts(
      req.user.companyId,
      d,
      req.user.id,
    );
  }
}

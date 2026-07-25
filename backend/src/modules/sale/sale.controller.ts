import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { SaleService } from './sale.service';
import { SalePaymentService } from './sale-payment.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { AddSaleItemDto } from './dto/add-sale-item.dto';
import { UpdateSaleItemDto } from './dto/update-sale-item.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly salePaymentService: SalePaymentService,
  ) {}

  @Get()
  findAll(@Request() req: any, @Query() query: SaleQueryDto) {
    const orderDir = (query.orderDir === 'asc' || query.orderDir === 'desc')
      ? query.orderDir : undefined;
    return this.saleService.findAll(req.user.companyId, {
      ...query,
      orderDir,
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.saleService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateSaleDto) {
    return this.saleService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.saleService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.saleService.remove(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/open')
  open(@Request() req: any, @Param('id') id: string) {
    return this.saleService.open(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/cancel')
  cancel(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.saleService.cancel(req.user.companyId, id, req.user.id, reason);
  }

  @Patch(':id/refund')
  refund(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.saleService.refund(req.user.companyId, id, req.user.id, reason);
  }

  @Post(':id/items')
  addItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddSaleItemDto,
  ) {
    return this.saleService.addItem(req.user.companyId, id, req.user.id, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateSaleItemDto,
  ) {
    return this.saleService.updateItem(
      req.user.companyId, id, itemId, req.user.id, dto,
    );
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Request() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.saleService.removeItem(
      req.user.companyId, id, itemId, req.user.id,
    );
  }

  @Post(':id/payments')
  createPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.salePaymentService.create(req.user.companyId, id, req.user.id, dto);
  }

  @Get(':id/payments')
  getPayments(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.findBySale(req.user.companyId, id);
  }
}

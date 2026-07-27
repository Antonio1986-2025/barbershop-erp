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
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly salePaymentService: SalePaymentService,
  ) {}

  @Get()
  @Permissions('sales.view')
  findAll(@Request() req: any, @Query() query: SaleQueryDto) {
    const orderDir = (query.orderDir === 'asc' || query.orderDir === 'desc')
      ? query.orderDir : undefined;
    return this.saleService.findAll(req.user.companyId, {
      ...query,
      orderDir,
    });
  }

  @Get(':id')
  @Permissions('sales.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.saleService.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('sales.create')
  create(@Request() req: any, @Body() dto: CreateSaleDto) {
    return this.saleService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('sales.update')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.saleService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id')
  @Permissions('sales.delete')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.saleService.remove(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/open')
  @Permissions('sales.update')
  open(@Request() req: any, @Param('id') id: string) {
    return this.saleService.open(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/cancel')
  @Permissions('sales.update')
  cancel(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.saleService.cancel(req.user.companyId, id, req.user.id, reason);
  }

  @Patch(':id/refund')
  @Permissions('sales.update')
  refund(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.saleService.refund(req.user.companyId, id, req.user.id, reason);
  }

  @Post(':id/items')
  @Permissions('sales.update')
  addItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddSaleItemDto,
  ) {
    return this.saleService.addItem(req.user.companyId, id, req.user.id, dto);
  }

  @Patch(':id/items/:itemId')
  @Permissions('sales.update')
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
  @Permissions('sales.delete')
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
  @Permissions('sales.create')
  createPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.salePaymentService.create(req.user.companyId, id, req.user.id, dto);
  }

  @Get(':id/payments')
  @Permissions('sales.view')
  getPayments(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.findBySale(req.user.companyId, id);
  }
}

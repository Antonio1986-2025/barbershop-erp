import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { AddPurchaseItemDto } from './dto/add-purchase-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir?: 'asc' | 'desc',
  ) {
    return this.purchaseService.findAll(req.user.companyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      supplierId,
      startDate,
      endDate,
      orderBy,
      orderDir,
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.purchaseService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreatePurchaseDto) {
    return this.purchaseService.create(req.user.companyId, req.user.id, dto);
  }

  @Post(':id/confirm')
  confirm(@Request() req: any, @Param('id') id: string) {
    return this.purchaseService.confirm(req.user.companyId, id, req.user.id);
  }

  @Post(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.purchaseService.cancel(req.user.companyId, id, req.user.id);
  }

  @Post(':id/items')
  addItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddPurchaseItemDto,
  ) {
    return this.purchaseService.addItem(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Request() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.purchaseService.removeItem(
      req.user.companyId,
      id,
      itemId,
      req.user.id,
    );
  }
}

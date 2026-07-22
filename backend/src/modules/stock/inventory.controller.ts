import {
  Controller, Get, Post, Patch,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto, AddInventoryItemDto, UpdateInventoryItemDto, InventoryQueryDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateInventoryDto) {
    return this.inventoryService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id/start')
  start(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.start(req.user.companyId, id, req.user.id);
  }

  @Post(':id/items')
  addItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddInventoryItemDto,
  ) {
    return this.inventoryService.addItem(req.user.companyId, id, req.user.id, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(
      req.user.companyId, id, itemId, req.user.id, dto,
    );
  }

  @Patch(':id/review')
  review(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.review(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/approve')
  approve(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.approve(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.cancel(req.user.companyId, id, req.user.id);
  }
}

import {
  Controller, Get, Post,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { AdjustStockDto, StockMovementQueryDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get('movements')
  findAll(
    @Request() req: any,
    @Query() query: StockMovementQueryDto,
  ) {
    return this.stockMovementService.findAll(req.user.companyId, query);
  }

  @Get('movements/:id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.stockMovementService.findOne(req.user.companyId, id);
  }

  @Get('products/:productId/stock')
  getProductStock(
    @Request() req: any,
    @Param('productId') productId: string,
  ) {
    return this.stockMovementService.getProductStock(
      req.user.companyId,
      productId,
    );
  }

  @Post('adjust')
  adjust(
    @Request() req: any,
    @Body() dto: AdjustStockDto,
  ) {
    return this.stockMovementService.adjust(
      req.user.companyId,
      dto,
      req.user.id,
    );
  }
}

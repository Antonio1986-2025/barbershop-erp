import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceOrderService } from './service-order.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';

@Controller('service-orders')
@UseGuards(AuthGuard('jwt'))
export class ServiceOrderController {
  constructor(private readonly service: ServiceOrderService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('unitId') unitId?: string,
    @Query('customerId') customerId?: string,
    @Query('professionalId') professionalId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(req.user.companyId, {
      unitId,
      customerId,
      professionalId,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateServiceOrderDto) {
    return this.service.create(req.user.companyId, req.user.id, dto);
  }

  @Post('test-raw')
  async createRaw(@Req() req: any, @Body() body: any) {
    try {
      return await this.service.create(req.user.companyId, req.user.id, body);
    } catch (e: any) {
      return { error: e.message, stack: e.stack?.split('\n').slice(0, 5).join('\n') };
    }
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderDto,
  ) {
    return this.service.update(req.user.companyId, id, req.user.id, dto);
  }

  @Post(':id/generate-sale')
  generateSale(@Req() req: any, @Param('id') id: string) {
    return this.service.generateSale(req.user.companyId, id, req.user.id);
  }

  @Post(':id/cancel')
  cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.service.cancel(req.user.companyId, id, req.user.id, reason);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.service.cancel(req.user.companyId, id, req.user.id, 'Exclusão');
    return { success: true };
  }
}

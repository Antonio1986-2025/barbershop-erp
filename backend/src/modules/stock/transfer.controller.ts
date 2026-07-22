import {
  Controller, Get, Post, Patch,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { TransferService } from './transfer.service';
import { CreateTransferDto, TransferQueryDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock/transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: TransferQueryDto) {
    return this.transferService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.transferService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateTransferDto) {
    return this.transferService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id/approve')
  approve(@Request() req: any, @Param('id') id: string) {
    return this.transferService.approve(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/send')
  send(@Request() req: any, @Param('id') id: string) {
    return this.transferService.send(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/receive')
  receive(@Request() req: any, @Param('id') id: string) {
    return this.transferService.receive(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.transferService.cancel(req.user.companyId, id, req.user.id);
  }
}

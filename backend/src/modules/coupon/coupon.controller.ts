import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  @Permissions('financial.view')
  findAll(@Request() req: any) {
    return this.couponService.findAll(req.user.companyId);
  }

  @Get(':id')
  @Permissions('financial.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.couponService.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('financial.create')
  create(@Request() req: any, @Body() dto: CreateCouponDto) {
    return this.couponService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('financial.update')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id')
  @Permissions('financial.delete')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.couponService.remove(req.user.companyId, id, req.user.id);
  }

  @Get('code/:code')
  @Permissions('financial.view')
  findByCode(@Request() req: any, @Param('code') code: string) {
    return this.couponService.findByCode(req.user.companyId, code);
  }

  @Post('validate')
  @Permissions('financial.validate')
  validate(@Request() req: any, @Body() body: { code: string; saleTotal: number }) {
    return this.couponService.validate(req.user.companyId, body.code, body.saleTotal);
  }

  @Post('apply/:saleId/:code')
  @Permissions('financial.delete')
  apply(@Request() req: any, @Param('saleId') saleId: string, @Param('code') code: string) {
    return this.couponService.apply(req.user.companyId, code, saleId, req.user.id);
  }
}

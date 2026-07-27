import {
  Controller, Get, Patch,
  Param, Request, UseGuards,
} from '@nestjs/common';
import { SalePaymentService } from './sale-payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly salePaymentService: SalePaymentService) {}

  @Get(':id')
  @Permissions('sales.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.findOne(req.user.companyId, id);
  }

  @Patch(':id/cancel')
  @Permissions('sales.update')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.cancel(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/refund')
  @Permissions('sales.update')
  refund(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.refund(req.user.companyId, id, req.user.id);
  }
}

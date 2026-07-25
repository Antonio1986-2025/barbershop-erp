import {
  Controller, Get, Patch,
  Param, Request, UseGuards,
} from '@nestjs/common';
import { SalePaymentService } from './sale-payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly salePaymentService: SalePaymentService) {}

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.findOne(req.user.companyId, id);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.cancel(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/refund')
  refund(@Request() req: any, @Param('id') id: string) {
    return this.salePaymentService.refund(req.user.companyId, id, req.user.id);
  }
}

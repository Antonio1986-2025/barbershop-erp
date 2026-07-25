import { Module } from '@nestjs/common';
import { ServiceOrderController } from './service-order.controller';
import { ServiceOrderService } from './service-order.service';
import { SaleModule } from '../sale/sale.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SaleModule, AuditModule],
  controllers: [ServiceOrderController],
  providers: [ServiceOrderService],
  exports: [ServiceOrderService],
})
export class ServiceOrderModule {}

import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { CustomerModule } from '../customer/customer.module';
import { SaleModule } from '../sale/sale.module';
import { ServiceOrderModule } from '../service-order/service-order.module';

@Module({
  imports: [CustomerModule, SaleModule, ServiceOrderModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}

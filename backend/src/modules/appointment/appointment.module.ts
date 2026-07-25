import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { CustomerModule } from '../customer/customer.module';
import { SaleModule } from '../sale/sale.module';

@Module({
  imports: [CustomerModule, SaleModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}

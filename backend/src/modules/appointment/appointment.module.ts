import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { CustomerModule } from '../customer/customer.module';
import { SaleModule } from '../sale/sale.module';
import { InteractionModule } from '../interaction/interaction.module';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [CustomerModule, SaleModule, InteractionModule, AutomationModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}

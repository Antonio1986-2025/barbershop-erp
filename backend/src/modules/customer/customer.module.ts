import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { PhoneService } from './phone.service';
import { InteractionModule } from '../interaction/interaction.module';

@Module({
  imports: [InteractionModule],
  controllers: [CustomerController],
  providers: [CustomerService, PhoneService],
  exports: [CustomerService, PhoneService],
})
export class CustomerModule {}

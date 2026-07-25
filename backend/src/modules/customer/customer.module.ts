import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { PhoneService } from './phone.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, PhoneService],
  exports: [CustomerService, PhoneService],
})
export class CustomerModule {}

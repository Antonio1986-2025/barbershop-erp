import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProfessionalModule } from './modules/professional/professional.module';
import { UnitModule } from './modules/unit/unit.module';

@Module({
  imports: [PrismaModule, DashboardModule, AuthModule, CustomerModule, ProfessionalModule, UnitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

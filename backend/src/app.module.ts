import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './modules/cache/cache.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProfessionalModule } from './modules/professional/professional.module';
import { UnitModule } from './modules/unit/unit.module';
import { ServiceModule } from './modules/service/service.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { CompanyModule } from './modules/company/company.module';
import { AuditModule } from './modules/audit/audit.module';
import { CompanySettingsModule } from './modules/company-settings/company-settings.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinancialModule } from './modules/financial/financial.module';
import { ObservabilityModule } from './modules/observability/observability.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
        skipIf: () => process.env.NODE_ENV === 'test',
      },
    ]),
    CacheModule,
    PrismaModule,
    ObservabilityModule,
    DashboardModule,
    AuthModule,
    CustomerModule,
    ProfessionalModule,
    UnitModule,
    ServiceModule,
    CategoryModule,
    ProductModule,
    UserModule,
    RoleModule,
    CompanyModule,
    AuditModule,
    CompanySettingsModule,
    ScheduleModule,
    AppointmentModule,
    NotificationsModule,
    FinancialModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

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
import { StockModule } from './modules/stock/stock.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinancialModule } from './modules/financial/financial.module';
import { SaleModule } from './modules/sale/sale.module';
import { CashModule } from './modules/cash/cash.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { CashbackModule } from './modules/cashback/cashback.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { CrmModule } from './modules/crm/crm.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { InteractionModule } from './modules/interaction/interaction.module';
import { TaskModule } from './modules/task/task.module';
import { AutomationModule } from './modules/automation/automation.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { ServiceOrderModule } from './modules/service-order/service-order.module';
import { BarberModule } from './modules/barber/barber.module';

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
    StockModule,
    SaleModule,
    CashModule,
    CouponModule,
    CashbackModule,
    LoyaltyModule,
    CrmModule,
    CampaignModule,
    InteractionModule,
    TaskModule,
    AutomationModule,
    IntegrationsModule,
    ConversationsModule,
    ScheduleModule,
    AppointmentModule,
    NotificationsModule,
    FinancialModule,
    ServiceOrderModule,
    BarberModule,
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

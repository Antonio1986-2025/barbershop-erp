import { Module } from '@nestjs/common';
import { SaleController } from './sale.controller';
import { PaymentController } from './payment.controller';
import { SaleDashboardController } from './sale-dashboard.controller';
import { SaleService } from './sale.service';
import { SalePaymentService } from './sale-payment.service';
import { SaleDashboardService } from './sale-dashboard.service';
import { StockModule } from '../stock/stock.module';
import { FinancialModule } from '../financial/financial.module';
import { CashbackModule } from '../cashback/cashback.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { AutomationModule } from '../automation/automation.module';
import { InteractionModule } from '../interaction/interaction.module';
import { CommissionModule } from '../commission/commission.module';

@Module({
  imports: [StockModule, FinancialModule, CashbackModule, LoyaltyModule, AutomationModule, InteractionModule, CommissionModule],
  controllers: [SaleController, PaymentController, SaleDashboardController],
  providers: [SaleService, SalePaymentService, SaleDashboardService],
  exports: [SaleService, SalePaymentService],
})
export class SaleModule {}

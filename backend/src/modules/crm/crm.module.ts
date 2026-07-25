import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmDashboardController } from './dashboard/crm-dashboard.controller';
import { CrmDashboardService } from './dashboard/crm-dashboard.service';

@Module({
  controllers: [CrmController, CrmDashboardController],
  providers: [CrmService, CrmDashboardService],
  exports: [CrmService, CrmDashboardService],
})
export class CrmModule {}

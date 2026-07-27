import { Module } from '@nestjs/common';
import { WorkScheduleController } from './work-schedule.controller';
import { WorkScheduleService } from './work-schedule.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [WorkScheduleController],
  providers: [WorkScheduleService],
  exports: [WorkScheduleService],
})
export class WorkScheduleModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationService } from './automation.service';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [ScheduleModule.forRoot(), TaskModule],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}

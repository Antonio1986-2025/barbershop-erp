import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessHourDto } from './create-business-hour.dto';
import { CreateScheduleBlockDto } from './create-schedule-block.dto';

export class UpdateBusinessHourDto extends PartialType(CreateBusinessHourDto) {}
export class UpdateScheduleBlockDto extends PartialType(CreateScheduleBlockDto) {}

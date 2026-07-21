import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateScheduleBlockDto {
  @IsString()
  unitId: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsIn(['UNIT', 'PROFESSIONAL'])
  type?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}

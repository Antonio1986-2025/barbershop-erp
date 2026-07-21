import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RescheduleAppointmentDto {
  @IsDateString()
  newStartAt: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class NotificationFilterDto {
  @IsOptional()
  @IsIn(['PENDING', 'SENT', 'FAILED', 'READ'])
  status?: string;

  @IsOptional()
  @IsIn([
    'APPOINTMENT_CREATED',
    'APPOINTMENT_CONFIRMED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_RESCHEDULED',
    'APPOINTMENT_REMINDER',
  ])
  type?: string;

  @IsOptional()
  @IsIn(['INTERNAL', 'EMAIL', 'WHATSAPP', 'SMS'])
  channel?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

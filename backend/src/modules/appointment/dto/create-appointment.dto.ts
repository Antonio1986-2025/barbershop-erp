import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  unitId: string;

  @IsString()
  professionalId: string;

  @IsString()
  customerId: string;

  @IsString()
  serviceId: string;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsOptional, IsString, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityFilterDto {
  @IsString()
  unitId: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  serviceId?: string;
}

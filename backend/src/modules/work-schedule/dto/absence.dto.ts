import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateAbsenceDto {
  @IsString()
  professionalId: string;

  @IsIn(['VACATION', 'DAY_OFF', 'BLOCKED', 'SICK_LEAVE'])
  type: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAbsenceDto {
  @IsOptional()
  @IsIn(['VACATION', 'DAY_OFF', 'BLOCKED', 'SICK_LEAVE'])
  type?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

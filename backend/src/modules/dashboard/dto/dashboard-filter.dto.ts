import { IsString, IsOptional, IsDateString } from 'class-validator';

export class DashboardFilter {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

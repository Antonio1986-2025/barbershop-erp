import { IsOptional, IsString, IsDateString } from 'class-validator';

export class DashboardAnalyticsFilter {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

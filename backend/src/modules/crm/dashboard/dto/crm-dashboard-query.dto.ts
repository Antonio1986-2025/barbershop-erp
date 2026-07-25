import { IsOptional, IsString } from 'class-validator';

export class CrmDashboardQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  unitId?: string;
}

import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class FinancialFilterDto {
  @IsOptional()
  @IsIn(['RECEIVABLE', 'PAYABLE'])
  type?: string;

  @IsOptional()
  @IsIn(['OPEN', 'PAID', 'OVERDUE', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

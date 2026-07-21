import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CashClosingDto {
  @IsString()
  cashRegisterId: string;

  @IsOptional()
  @IsNumber()
  expectedAmount?: number;

  @IsOptional()
  @IsNumber()
  closingAmount?: number;
}

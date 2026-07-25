import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseCashDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  closingAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedAmount?: number;
}

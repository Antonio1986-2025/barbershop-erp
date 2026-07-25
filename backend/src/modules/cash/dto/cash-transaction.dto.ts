import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CashTransactionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  description: string;
}

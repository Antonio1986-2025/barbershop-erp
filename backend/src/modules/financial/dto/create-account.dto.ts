import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  categoryId: string;

  @IsString()
  description: string;

  @IsIn(['RECEIVABLE', 'PAYABLE'])
  type: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

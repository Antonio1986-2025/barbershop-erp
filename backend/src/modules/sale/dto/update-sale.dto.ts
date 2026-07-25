import { IsString, IsOptional } from 'class-validator';

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

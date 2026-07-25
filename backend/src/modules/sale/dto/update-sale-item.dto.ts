import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSaleItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddPurchaseItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;
}

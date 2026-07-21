import { IsString, IsIn, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsIn(['INCOME', 'EXPENSE'])
  type: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

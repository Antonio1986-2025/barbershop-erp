import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';

export class SegmentRuleDto {
  @IsString()
  field: string;

  @IsString()
  operator: string;

  value: any;

  @IsOptional()
  periodDays?: number;
}

export class CreateSegmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  rules: SegmentRuleDto[];

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  rules?: SegmentRuleDto[];

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  active?: boolean;
}

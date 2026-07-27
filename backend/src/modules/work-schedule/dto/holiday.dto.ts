import { IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateHolidayDto {
  @IsDateString()
  date: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;
}

export class UpdateHolidayDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;
}

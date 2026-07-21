import { IsInt, IsString, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class CreateBusinessHourDto {
  @IsString()
  unitId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

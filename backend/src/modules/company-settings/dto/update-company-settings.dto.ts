import { IsOptional, IsString, IsInt, IsBoolean, Min } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultAppointmentDuration?: number;

  @IsOptional()
  @IsBoolean()
  allowOnlineScheduling?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationLimitHours?: number;
}

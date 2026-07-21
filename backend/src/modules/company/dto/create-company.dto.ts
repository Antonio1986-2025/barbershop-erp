import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class CreateCompanyDto {
  @IsString()
  corporateName: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsString()
  document: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}

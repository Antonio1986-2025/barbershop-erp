import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  unitId: string;

  @IsString()
  professionalId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  serviceId: string;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // 🔹 Criar novo cliente automaticamente
  @IsOptional()
  @IsString()
  newCustomerName?: string;

  @IsOptional()
  @IsString()
  newCustomerPhone?: string;

  // 🔹 Abrir comanda (venda) automaticamente
  @IsOptional()
  @IsBoolean()
  createSale?: boolean;
}

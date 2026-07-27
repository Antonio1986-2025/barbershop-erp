import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Permissions('customers.view')
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('phone') phone?: string,
    @Query('active') active?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir?: 'asc' | 'desc',
  ) {
    return this.customerService.findAll(req.user.companyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      phone,
      active,
      orderBy,
      orderDir,
    });
  }

  /**
   * Endpoint de busca unificado para fluxo telefone-primeiro.
   * Se phone for informado, busca por telefone normalizado.
   * Caso contrário, funciona como search genérico.
   */
  @Get('search')
  @Permissions('customers.view')
  search(
    @Request() req: any,
    @Query('phone') phone?: string,
    @Query('q') q?: string,
  ) {
    if (phone) {
      return this.customerService.findByPhone(req.user.companyId, phone);
    }
    // Fallback: primeira página com search
    return this.customerService.findAll(req.user.companyId, {
      search: q,
      limit: 10,
    });
  }

  @Get(':id')
  @Permissions('customers.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.customerService.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('customers.create')
  create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('customers.update')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(
      req.user.companyId,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('customers.delete')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.customerService.remove(req.user.companyId, id, req.user.id);
  }
}

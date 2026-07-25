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

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
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
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.customerService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
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
  remove(@Request() req: any, @Param('id') id: string) {
    return this.customerService.remove(req.user.companyId, id, req.user.id);
  }
}

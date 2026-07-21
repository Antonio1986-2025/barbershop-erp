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
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Permissions('companies.view')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir?: 'asc' | 'desc',
  ) {
    return this.companyService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
      orderBy,
      orderDir,
    });
  }

  @Get(':id')
  @Permissions('companies.view')
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @Permissions('companies.create')
  create(@Request() req: any, @Body() dto: CreateCompanyDto) {
    return this.companyService.create(req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('companies.update')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @Permissions('companies.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.companyService.remove(id, req.user.id);
  }
}

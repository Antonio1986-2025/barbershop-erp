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
import { ProfessionalService } from './professional.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('professionals')
export class ProfessionalController {
  constructor(private readonly professionalService: ProfessionalService) {}

  @Get()
  @Permissions('professionals.view')
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('active') active?: string,
    @Query('unitId') unitId?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir?: 'asc' | 'desc',
  ) {
    return this.professionalService.findAll(req.user.companyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      active,
      unitId,
      orderBy,
      orderDir,
    });
  }

  @Get(':id')
  @Permissions('professionals.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.professionalService.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('professionals.create')
  create(@Request() req: any, @Body() dto: CreateProfessionalDto) {
    return this.professionalService.create(
      req.user.companyId,
      req.user.id,
      dto,
    );
  }

  @Patch(':id')
  @Permissions('professionals.update')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalService.update(
      req.user.companyId,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('professionals.delete')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.professionalService.remove(req.user.companyId, id, req.user.id);
  }
}

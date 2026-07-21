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
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir?: 'asc' | 'desc',
    @Query('simple') simple?: string,
  ) {
    if (simple === 'true') {
      return this.unitService.findAllSimple(req.user.companyId);
    }
    return this.unitService.findAll(req.user.companyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
      orderBy,
      orderDir,
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.unitService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateUnitDto) {
    return this.unitService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.unitService.remove(req.user.companyId, id, req.user.id);
  }
}

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
import { ScheduleService } from './schedule.service';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { AvailabilityFilterDto } from './dto/availability-filter.dto';
import {
  UpdateBusinessHourDto,
  UpdateScheduleBlockDto,
} from './dto/update.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('schedule')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Get('business-hours')
  @Permissions('schedule.view')
  findBusinessHours(@Request() req: any, @Query('unitId') unitId?: string) {
    return this.service.findBusinessHours(req.user.companyId, unitId);
  }

  @Post('business-hours')
  @Permissions('schedule.create')
  createBusinessHour(@Body() dto: CreateBusinessHourDto, @Request() req: any) {
    return this.service.createBusinessHour(
      req.user.companyId,
      req.user.id,
      dto,
    );
  }

  @Patch('business-hours/:id')
  @Permissions('schedule.update')
  updateBusinessHour(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessHourDto,
    @Request() req: any,
  ) {
    return this.service.updateBusinessHour(
      req.user.companyId,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete('business-hours/:id')
  @Permissions('schedule.delete')
  removeBusinessHour(@Param('id') id: string, @Request() req: any) {
    return this.service.removeBusinessHour(req.user.companyId, id, req.user.id);
  }

  @Get('blocks')
  @Permissions('schedule.view')
  findBlocks(
    @Request() req: any,
    @Query('unitId') unitId?: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.service.findBlocks(req.user.companyId, unitId, professionalId);
  }

  @Post('blocks')
  @Permissions('schedule.create')
  createBlock(@Body() dto: CreateScheduleBlockDto, @Request() req: any) {
    return this.service.createBlock(req.user.companyId, req.user.id, dto);
  }

  @Patch('blocks/:id')
  @Permissions('schedule.update')
  updateBlock(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleBlockDto,
    @Request() req: any,
  ) {
    return this.service.updateBlock(req.user.companyId, id, req.user.id, dto);
  }

  @Delete('blocks/:id')
  @Permissions('schedule.delete')
  removeBlock(@Param('id') id: string, @Request() req: any) {
    return this.service.removeBlock(req.user.companyId, id, req.user.id);
  }

  @Get('availability')
  @Permissions('schedule.view')
  getAvailability(@Query() dto: AvailabilityFilterDto, @Request() req: any) {
    return this.service.getAvailability(
      req.user.companyId,
      dto.unitId,
      dto.date,
      dto.professionalId,
      dto.serviceId,
    );
  }
}

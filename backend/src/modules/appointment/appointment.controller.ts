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
import { AppointmentService } from './appointment.service';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  CancelAppointmentDto,
  RescheduleAppointmentDto,
} from './dto/cancel-reschedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  @Get()
  @Permissions('schedule.view')
  findAll(@Request() req: any, @Query() filter: AppointmentFilterDto) {
    return this.service.findAll(req.user.companyId, filter);
  }

  @Get('calendar')
  @Permissions('schedule.view')
  findByDateRange(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('unitId') unitId?: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.service.findByDateRange(
      req.user.companyId,
      startDate,
      endDate,
      unitId,
      professionalId,
    );
  }

  @Get(':id')
  @Permissions('schedule.view')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('schedule.create')
  create(@Body() dto: CreateAppointmentDto, @Request() req: any) {
    return this.service.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('schedule.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @Request() req: any,
  ) {
    return this.service.update(req.user.companyId, id, req.user.id, dto);
  }

  @Post(':id/cancel')
  @Permissions('schedule.update')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @Request() req: any,
  ) {
    return this.service.cancel(req.user.companyId, id, req.user.id, dto);
  }

  @Post(':id/reschedule')
  @Permissions('schedule.create')
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @Request() req: any,
  ) {
    return this.service.reschedule(req.user.companyId, id, req.user.id, dto);
  }

  @Patch(':id/status')
  @Permissions('schedule.update')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.service.updateStatus(
      req.user.companyId,
      id,
      req.user.id,
      status,
    );
  }

  @Delete(':id')
  @Permissions('schedule.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.softRemove(req.user.companyId, id, req.user.id);
  }
}

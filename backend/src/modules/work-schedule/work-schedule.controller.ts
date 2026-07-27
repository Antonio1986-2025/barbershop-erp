import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { WorkScheduleService } from './work-schedule.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { CreateAbsenceDto, UpdateAbsenceDto } from './dto/absence.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('work-schedule')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkScheduleController {
  constructor(private readonly service: WorkScheduleService) {}

  // ── Holidays ──

  @Get('holidays')
  @Permissions('schedule.view')
  findHolidays(@Request() req: any) {
    return this.service.findHolidays(req.user.companyId);
  }

  @Post('holidays')
  @Permissions('schedule.create')
  createHoliday(@Body() dto: CreateHolidayDto, @Request() req: any) {
    return this.service.createHoliday(req.user.companyId, req.user.id, dto);
  }

  @Patch('holidays/:id')
  @Permissions('schedule.update')
  updateHoliday(@Param('id') id: string, @Body() dto: UpdateHolidayDto, @Request() req: any) {
    return this.service.updateHoliday(req.user.companyId, id, req.user.id, dto);
  }

  @Delete('holidays/:id')
  @Permissions('schedule.delete')
  removeHoliday(@Param('id') id: string, @Request() req: any) {
    return this.service.removeHoliday(req.user.companyId, id, req.user.id);
  }

  // ── Absences ──

  @Get('absences')
  @Permissions('schedule.view')
  findAbsences(@Request() req: any, @Query('professionalId') professionalId?: string) {
    return this.service.findAbsences(req.user.companyId, professionalId);
  }

  @Post('absences')
  @Permissions('schedule.create')
  createAbsence(@Body() dto: CreateAbsenceDto, @Request() req: any) {
    return this.service.createAbsence(req.user.companyId, req.user.id, dto);
  }

  @Patch('absences/:id')
  @Permissions('schedule.update')
  updateAbsence(@Param('id') id: string, @Body() dto: UpdateAbsenceDto, @Request() req: any) {
    return this.service.updateAbsence(req.user.companyId, id, req.user.id, dto);
  }

  @Delete('absences/:id')
  @Permissions('schedule.delete')
  removeAbsence(@Param('id') id: string, @Request() req: any) {
    return this.service.removeAbsence(req.user.companyId, id, req.user.id);
  }
}

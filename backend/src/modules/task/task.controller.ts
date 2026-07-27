import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @Permissions('schedule.view')
  findAll(@Request() req: any, @Query() filter: TaskFilterDto) {
    return this.taskService.findAll(req.user.companyId, filter);
  }

  @Get(':id')
  @Permissions('schedule.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.taskService.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('schedule.create')
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.taskService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('schedule.update')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Patch(':id/complete')
  @Permissions('schedule.update')
  complete(@Request() req: any, @Param('id') id: string) {
    return this.taskService.complete(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/cancel')
  @Permissions('schedule.update')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.taskService.cancel(req.user.companyId, id, req.user.id);
  }
}

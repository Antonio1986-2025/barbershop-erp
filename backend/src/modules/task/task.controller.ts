import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('crm/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  findAll(@Request() req: any, @Query() filter: TaskFilterDto) {
    return this.taskService.findAll(req.user.companyId, filter);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.taskService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.taskService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Patch(':id/complete')
  complete(@Request() req: any, @Param('id') id: string) {
    return this.taskService.complete(req.user.companyId, id, req.user.id);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.taskService.cancel(req.user.companyId, id, req.user.id);
  }
}

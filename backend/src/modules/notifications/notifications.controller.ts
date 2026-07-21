import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Permissions('notifications.view')
  findAll(@Request() req: any, @Query() filter: NotificationFilterDto) {
    return this.service.findAll(req.user.companyId, filter);
  }

  @Get('unread-count')
  @Permissions('notifications.view')
  countUnread(@Request() req: any) {
    return this.service.countUnread(req.user.companyId);
  }

  @Get(':id')
  @Permissions('notifications.view')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('notifications.create')
  create(@Body() dto: CreateNotificationDto, @Request() req: any) {
    return this.service.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id/read')
  @Permissions('notifications.update')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.service.markAsRead(req.user.companyId, id, req.user.id);
  }
}

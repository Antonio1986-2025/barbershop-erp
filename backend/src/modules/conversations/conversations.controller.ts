import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationQueryDto, MessageQueryDto, SendMessageDto } from './dto/conversation-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @Permissions('customers.view')
  findAll(@Request() req: any, @Query() query: ConversationQueryDto) {
    return this.conversationsService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @Permissions('customers.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.findOne(req.user.companyId, id);
  }

  @Get(':id/messages')
  @Permissions('customers.view')
  getMessages(@Request() req: any, @Param('id') id: string, @Query() query: MessageQueryDto) {
    return this.conversationsService.getMessages(req.user.companyId, id, query);
  }

  @Post(':id/messages')
  @Permissions('customers.create')
  sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Query('integrationId') integrationId?: string,
  ) {
    return this.conversationsService.sendMessage(req.user.companyId, id, req.user.id, dto.content, integrationId);
  }

  @Patch(':id/assign')
  @Permissions('customers.update')
  assign(@Request() req: any, @Param('id') id: string, @Body('assignedToId') assignedToId: string) {
    return this.conversationsService.assign(req.user.companyId, id, req.user.id, assignedToId);
  }

  @Patch(':id/priority')
  @Permissions('customers.update')
  setPriority(@Request() req: any, @Param('id') id: string, @Body('priority') priority: string) {
    return this.conversationsService.setPriority(req.user.companyId, id, req.user.id, priority);
  }

  @Patch(':id/close')
  @Permissions('customers.update')
  close(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.close(req.user.companyId, id, req.user.id);
  }

  @Post(':id/notes')
  @Permissions('customers.create')
  addNote(@Request() req: any, @Param('id') id: string, @Body('content') content: string) {
    return this.conversationsService.addNote(req.user.companyId, id, req.user.id, content);
  }

  @Get(':id/notes')
  @Permissions('customers.view')
  getNotes(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.getNotes(req.user.companyId, id);
  }

  @Post(':id/tags')
  @Permissions('customers.create')
  addTag(@Request() req: any, @Param('id') id: string, @Body('tag') tag: string) {
    return this.conversationsService.addTag(req.user.companyId, id, req.user.id, tag);
  }

  @Delete(':id/tags/:tagId')
  @Permissions('customers.update')
  removeTag(@Request() req: any, @Param('id') id: string, @Param('tagId') tagId: string) {
    return this.conversationsService.removeTag(req.user.companyId, id, tagId, req.user.id);
  }
}

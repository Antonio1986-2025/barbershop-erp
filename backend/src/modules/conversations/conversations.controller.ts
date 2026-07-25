import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationQueryDto, MessageQueryDto, SendMessageDto } from './dto/conversation-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: ConversationQueryDto) {
    return this.conversationsService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.findOne(req.user.companyId, id);
  }

  @Get(':id/messages')
  getMessages(@Request() req: any, @Param('id') id: string, @Query() query: MessageQueryDto) {
    return this.conversationsService.getMessages(req.user.companyId, id, query);
  }

  @Post(':id/messages')
  sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Query('integrationId') integrationId?: string,
  ) {
    return this.conversationsService.sendMessage(req.user.companyId, id, req.user.id, dto.content, integrationId);
  }

  @Patch(':id/assign')
  assign(@Request() req: any, @Param('id') id: string, @Body('assignedToId') assignedToId: string) {
    return this.conversationsService.assign(req.user.companyId, id, req.user.id, assignedToId);
  }

  @Patch(':id/priority')
  setPriority(@Request() req: any, @Param('id') id: string, @Body('priority') priority: string) {
    return this.conversationsService.setPriority(req.user.companyId, id, req.user.id, priority);
  }

  @Patch(':id/close')
  close(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.close(req.user.companyId, id, req.user.id);
  }

  @Post(':id/notes')
  addNote(@Request() req: any, @Param('id') id: string, @Body('content') content: string) {
    return this.conversationsService.addNote(req.user.companyId, id, req.user.id, content);
  }

  @Get(':id/notes')
  getNotes(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.getNotes(req.user.companyId, id);
  }

  @Post(':id/tags')
  addTag(@Request() req: any, @Param('id') id: string, @Body('tag') tag: string) {
    return this.conversationsService.addTag(req.user.companyId, id, req.user.id, tag);
  }

  @Delete(':id/tags/:tagId')
  removeTag(@Request() req: any, @Param('id') id: string, @Param('tagId') tagId: string) {
    return this.conversationsService.removeTag(req.user.companyId, id, tagId, req.user.id);
  }
}

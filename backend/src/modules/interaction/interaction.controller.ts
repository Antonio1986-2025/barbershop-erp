import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { CreateInteractionDto, InteractionFilterDto } from './dto/create-interaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('crm/interactions')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Get()
  findAll(@Request() req: any, @Query() filter: InteractionFilterDto) {
    return this.interactionService.findAll(req.user.companyId, filter);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.interactionService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateInteractionDto) {
    return this.interactionService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: { subject?: string; description?: string }) {
    return this.interactionService.update(req.user.companyId, id, req.user.id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.interactionService.remove(req.user.companyId, id, req.user.id);
  }
}

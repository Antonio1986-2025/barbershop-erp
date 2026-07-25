import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/create-campaign.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('crm/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.campaignService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.campaignService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCampaignDto) {
    return this.campaignService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.campaignService.remove(req.user.companyId, id, req.user.id);
  }

  @Post(':id/recipients')
  addRecipients(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { customerIds: string[] },
  ) {
    return this.campaignService.addRecipients(req.user.companyId, id, req.user.id, body.customerIds);
  }

  @Get(':id/recipients')
  getRecipients(@Request() req: any, @Param('id') id: string) {
    return this.campaignService.getRecipients(req.user.companyId, id);
  }
}

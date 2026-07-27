import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/create-campaign.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @Permissions('customers.view')
  findAll(@Request() req: any) {
    return this.campaignService.findAll(req.user.companyId);
  }

  @Get(':id')
  @Permissions('customers.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.campaignService.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('customers.create')
  create(@Request() req: any, @Body() dto: CreateCampaignDto) {
    return this.campaignService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('customers.view')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id')
  @Permissions('customers.view')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.campaignService.remove(req.user.companyId, id, req.user.id);
  }

  @Post(':id/recipients')
  @Permissions('customers.create')
  addRecipients(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { customerIds: string[] },
  ) {
    return this.campaignService.addRecipients(req.user.companyId, id, req.user.id, body.customerIds);
  }

  @Get(':id/recipients')
  @Permissions('customers.view')
  getRecipients(@Request() req: any, @Param('id') id: string) {
    return this.campaignService.getRecipients(req.user.companyId, id);
  }
}

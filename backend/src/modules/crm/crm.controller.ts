import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateSegmentDto, UpdateSegmentDto } from './dto/create-segment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('profile/:customerId')
  @Permissions('customers.view')
  getProfile(@Request() req: any, @Param('customerId') customerId: string) {
    return this.crmService.getProfile(req.user.companyId, customerId);
  }

  @Get('segments')
  @Permissions('customers.view')
  getSegments(@Request() req: any) {
    return this.crmService.getSegments(req.user.companyId);
  }

  @Get('segments/:id')
  @Permissions('customers.view')
  findSegment(@Request() req: any, @Param('id') id: string) {
    return this.crmService.findSegment(req.user.companyId, id);
  }

  @Post('segments')
  @Permissions('customers.create')
  createSegment(@Request() req: any, @Body() dto: CreateSegmentDto) {
    return this.crmService.createSegment(req.user.companyId, dto);
  }

  @Patch('segments/:id')
  @Permissions('customers.update')
  updateSegment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.crmService.updateSegment(req.user.companyId, id, dto);
  }

  @Delete('segments/:id')
  @Permissions('customers.delete')
  deleteSegment(@Request() req: any, @Param('id') id: string) {
    return this.crmService.deleteSegment(req.user.companyId, id);
  }

  @Get('segments/customer/:customerId')
  @Permissions('customers.view')
  getCustomerSegments(@Request() req: any, @Param('customerId') customerId: string) {
    return this.crmService.getCustomerSegments(req.user.companyId, customerId);
  }
}

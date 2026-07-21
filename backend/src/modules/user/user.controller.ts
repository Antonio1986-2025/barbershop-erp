import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions('users.view')
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('active') active?: string,
    @Query('roleId') roleId?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir?: 'asc' | 'desc',
  ) {
    return this.userService.findAll(req.user.companyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      active,
      roleId,
      orderBy,
      orderDir,
    });
  }

  @Get(':id')
  @Permissions('users.view')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.userService.findOne(req.user.companyId, id);
  }

  @Post()
  @Permissions('users.create')
  create(@Request() req: any, @Body() dto: CreateUserDto) {
    return this.userService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(':id')
  @Permissions('users.update')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(req.user.companyId, id, req.user.id, dto);
  }

  @Delete(':id')
  @Permissions('users.delete')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.userService.remove(req.user.companyId, id, req.user.id);
  }
}

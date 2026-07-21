import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { Roles } from './decorators/roles.decorator';
import { Permissions } from './decorators/permissions.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Request() req: any) {
    const ip = req.ip ?? req.connection?.remoteAddress;
    const ua = req.headers?.['user-agent'];
    return this.authService.login(dto, ip, ua);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Request() req: any) {
    const ip = req.ip ?? req.connection?.remoteAddress;
    const ua = req.headers?.['user-agent'];
    return this.authService.refresh(dto, ip, ua);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.me(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-only')
  adminOnly() {
    return { message: 'Acesso de administrador concedido' };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user.manage')
  @Get('manage-users')
  manageUsers() {
    return { message: 'Permissão de gerenciar usuários concedida' };
  }
}

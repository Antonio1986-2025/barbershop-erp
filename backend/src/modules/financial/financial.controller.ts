import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { FinancialFilterDto } from './dto/financial-filter.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CashClosingDto } from './dto/cash-closing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('financial')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinancialController {
  constructor(private readonly service: FinancialService) {}

  // ── Categories ──

  @Get('categories')
  @Permissions('financial.view')
  findCategories(@Request() req: any) {
    return this.service.findCategories(req.user.companyId);
  }

  @Post('categories')
  @Permissions('financial.create')
  createCategory(@Body() dto: CreateCategoryDto, @Request() req: any) {
    return this.service.createCategory(req.user.companyId, req.user.id, dto);
  }

  @Patch('categories/:id')
  @Permissions('financial.update')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Request() req: any) {
    return this.service.updateCategory(req.user.companyId, id, req.user.id, dto);
  }

  @Delete('categories/:id')
  @Permissions('financial.delete')
  removeCategory(@Param('id') id: string, @Request() req: any) {
    return this.service.removeCategory(req.user.companyId, id, req.user.id);
  }

  // ── Accounts ──

  @Get('accounts')
  @Permissions('financial.view')
  findAccounts(@Request() req: any, @Query() filter: FinancialFilterDto) {
    return this.service.findAccounts(req.user.companyId, filter);
  }

  @Get('accounts/:id')
  @Permissions('financial.view')
  findAccount(@Param('id') id: string, @Request() req: any) {
    return this.service.findAccount(req.user.companyId, id);
  }

  @Post('accounts')
  @Permissions('financial.create')
  createAccount(@Body() dto: CreateAccountDto, @Request() req: any) {
    return this.service.createAccount(req.user.companyId, req.user.id, dto);
  }

  @Patch('accounts/:id')
  @Permissions('financial.update')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto, @Request() req: any) {
    return this.service.updateAccount(req.user.companyId, id, req.user.id, dto);
  }

  @Patch('accounts/:id/pay')
  @Permissions('financial.update')
  payAccount(@Param('id') id: string, @Request() req: any) {
    return this.service.payAccount(req.user.companyId, id, req.user.id);
  }

  @Patch('accounts/:id/cancel')
  @Permissions('financial.update')
  cancelAccount(@Param('id') id: string, @Request() req: any) {
    return this.service.cancelAccount(req.user.companyId, id, req.user.id);
  }

  // ── Cash Flow ──

  @Get('cash-flow')
  @Permissions('financial.view')
  getCashFlow(@Request() req: any, @Query('unitId') unitId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.service.getCashFlow(req.user.companyId, unitId, startDate, endDate);
  }

  // ── Cash Closing ──

  @Post('cash-closing')
  @Permissions('financial.close_cash')
  createCashClosing(@Body() dto: CashClosingDto, @Request() req: any) {
    return this.service.createCashClosing(req.user.companyId, req.user.id, dto);
  }

  @Get('cash-closing')
  @Permissions('financial.view')
  findCashClosings(@Request() req: any, @Query('unitId') unitId?: string) {
    return this.service.findCashClosings(req.user.companyId, unitId);
  }
}

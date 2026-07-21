import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FinancialFilterDto } from './dto/financial-filter.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CashClosingDto } from './dto/cash-closing.dto';

@Injectable()
export class FinancialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ── Categories ──

  async findCategories(companyId: string) {
    return this.prisma.financialCategory.findMany({
      where: { companyId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(companyId: string, userId: string, dto: CreateCategoryDto) {
    const result = await this.prisma.financialCategory.create({
      data: { companyId, name: dto.name, type: dto.type as any },
    });
    await this.auditService.create({ companyId, userId, action: 'CREATE', entity: 'FinancialCategory', entityId: result.id, newData: result as any });
    return result;
  }

  async updateCategory(companyId: string, id: string, userId: string, dto: UpdateCategoryDto) {
    const old = await this.prisma.financialCategory.findFirst({ where: { id, companyId } });
    if (!old) throw new NotFoundException('Categoria não encontrada');
    const result = await this.prisma.financialCategory.update({ where: { id }, data: dto as any });
    await this.auditService.create({ companyId, userId, action: 'UPDATE', entity: 'FinancialCategory', entityId: id, oldData: old as any, newData: result as any });
    return result;
  }

  async removeCategory(companyId: string, id: string, userId: string) {
    const old = await this.prisma.financialCategory.findFirst({ where: { id, companyId } });
    if (!old) throw new NotFoundException('Categoria não encontrada');
    await this.prisma.financialCategory.update({ where: { id }, data: { active: false } });
    await this.auditService.create({ companyId, userId, action: 'DELETE', entity: 'FinancialCategory', entityId: id, oldData: old as any });
  }

  // ── Accounts ──

  async findAccounts(companyId: string, filter: FinancialFilterDto) {
    const page = Math.max(1, parseInt(filter.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(filter.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.startDate || filter.endDate) {
      where.dueDate = {};
      if (filter.startDate) where.dueDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.dueDate.lte = new Date(filter.endDate);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.financialAccount.findMany({
        where, orderBy: { dueDate: 'desc' }, skip, take: limit,
        include: { category: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.financialAccount.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findAccount(companyId: string, id: string) {
    const result = await this.prisma.financialAccount.findFirst({
      where: { id, companyId },
      include: { category: { select: { id: true, name: true, type: true } } },
    });
    if (!result) throw new NotFoundException('Conta não encontrada');
    return result;
  }

  async createAccount(companyId: string, userId: string, dto: CreateAccountDto) {
    const cat = await this.prisma.financialCategory.findFirst({ where: { id: dto.categoryId, companyId } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');

    const result = await this.prisma.financialAccount.create({
      data: {
        companyId,
        categoryId: dto.categoryId,
        description: dto.description,
        type: dto.type as any,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        status: dto.paidAt ? 'PAID' : 'OPEN',
        createdBy: userId,
      },
      include: { category: { select: { id: true, name: true, type: true } } },
    });
    await this.auditService.create({ companyId, userId, action: 'CREATE', entity: 'FinancialAccount', entityId: result.id, newData: result as any });
    return result;
  }

  async updateAccount(companyId: string, id: string, userId: string, dto: UpdateAccountDto) {
    const old = await this.findAccount(companyId, id);
    const data: any = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.paidAt) { data.paidAt = new Date(dto.paidAt); data.status = 'PAID' }
    const result = await this.prisma.financialAccount.update({
      where: { id }, data,
      include: { category: { select: { id: true, name: true, type: true } } },
    });
    await this.auditService.create({ companyId, userId, action: 'UPDATE', entity: 'FinancialAccount', entityId: id, oldData: old as any, newData: result as any });
    return result;
  }

  async payAccount(companyId: string, id: string, userId: string) {
    const old = await this.findAccount(companyId, id);
    if (old.status === 'PAID') throw new BadRequestException('Conta já está paga');
    if (old.status === 'CANCELLED') throw new BadRequestException('Conta cancelada não pode ser paga');

    const result = await this.prisma.financialAccount.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { category: { select: { id: true, name: true, type: true } } },
    });
    await this.auditService.create({ companyId, userId, action: 'PAY', entity: 'FinancialAccount', entityId: id, oldData: old as any, newData: result as any });
    return result;
  }

  async cancelAccount(companyId: string, id: string, userId: string) {
    const old = await this.findAccount(companyId, id);
    if (old.status === 'PAID') throw new BadRequestException('Conta paga não pode ser cancelada');
    if (old.status === 'CANCELLED') throw new BadRequestException('Conta já está cancelada');

    const result = await this.prisma.financialAccount.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { category: { select: { id: true, name: true, type: true } } },
    });
    await this.auditService.create({ companyId, userId, action: 'CANCEL', entity: 'FinancialAccount', entityId: id, oldData: old as any, newData: result as any });
    return result;
  }

  // ── Cash Flow ──

  async getCashFlow(companyId: string, unitId?: string, startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getFullYear(), end.getMonth(), 1);

    const whereAccounts: any = { companyId, status: { not: 'CANCELLED' } };
    if (unitId) whereAccounts.unitId = unitId;
    if (startDate || endDate) {
      whereAccounts.dueDate = {};
      if (startDate) whereAccounts.dueDate.gte = start;
      if (endDate) whereAccounts.dueDate.lte = end;
    }

    const accounts = await this.prisma.financialAccount.findMany({ where: whereAccounts });
    const income = accounts.filter(a => a.type === 'RECEIVABLE');
    const expense = accounts.filter(a => a.type === 'PAYABLE');

    const incomeTotal = income.reduce((s, a) => s + Number(a.amount), 0);
    const incomePaid = income.filter(a => a.status === 'PAID').reduce((s, a) => s + Number(a.amount), 0);
    const expenseTotal = expense.reduce((s, a) => s + Number(a.amount), 0);
    const expensePaid = expense.filter(a => a.status === 'PAID').reduce((s, a) => s + Number(a.amount), 0);

    const whereTx: any = { companyId, createdAt: { gte: start, lte: end } };
    if (unitId) whereTx.unitId = unitId;
    const transactions = await this.prisma.cashTransaction.findMany({ where: whereTx });
    const cashIn = transactions.filter(t => t.type === 'ENTRY').reduce((s, t) => s + Number(t.amount), 0);
    const cashOut = transactions.filter(t => t.type === 'EXIT').reduce((s, t) => s + Number(t.amount), 0);

    return {
      period: { start, end },
      income: { total: incomeTotal, paid: incomePaid, pending: incomeTotal - incomePaid },
      expense: { total: expenseTotal, paid: expensePaid, pending: expenseTotal - expensePaid },
      balance: { expected: incomeTotal - expenseTotal, realized: incomePaid - expensePaid },
      cashFlow: { in: cashIn, out: cashOut, balance: cashIn - cashOut },
    };
  }

  // ── Cash Closing ──

  async createCashClosing(companyId: string, userId: string, dto: CashClosingDto) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: dto.cashRegisterId, companyId },
      include: { transactions: true },
    });
    if (!register) throw new NotFoundException('Caixa não encontrado');
    if (register.status === 'CLOSED') throw new BadRequestException('Caixa já está fechado');

    const entries = register.transactions.filter(t => t.type === 'ENTRY').reduce((s, t) => s + Number(t.amount), 0);
    const exits = register.transactions.filter(t => t.type === 'EXIT').reduce((s, t) => s + Number(t.amount), 0);
    const expected = dto.expectedAmount ?? (Number(register.openingAmount) + entries - exits);
    const closingAmount = dto.closingAmount ?? expected;
    const difference = closingAmount - expected;

    const result = await this.prisma.cashClosing.create({
      data: {
        companyId,
        unitId: register.unitId,
        cashRegisterId: register.id,
        openedAt: register.openedAt,
        closedAt: new Date(),
        openingAmount: register.openingAmount,
        expectedAmount: expected,
        closingAmount,
        difference,
        closedBy: userId,
      },
    });

    await this.prisma.cashRegister.update({
      where: { id: register.id },
      data: { status: 'CLOSED', closedAt: new Date(), closedBy: userId },
    });

    await this.auditService.create({
      companyId, userId, action: 'CLOSE_CASH', entity: 'CashClosing', entityId: result.id,
      newData: { closingAmount: result.closingAmount, difference: result.difference } as any,
    });

    return result;
  }

  async findCashClosings(companyId: string, unitId?: string) {
    const where: any = { companyId };
    if (unitId) where.unitId = unitId;
    return this.prisma.cashClosing.findMany({
      where,
      orderBy: { closedAt: 'desc' },
      include: { unit: { select: { id: true, name: true } } },
    });
  }
}

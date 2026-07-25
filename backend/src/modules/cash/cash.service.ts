import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FinancialService } from '../financial/financial.service';
import { OpenCashDto } from './dto/open-cash.dto';
import { CloseCashDto } from './dto/close-cash.dto';
import { CashTransactionDto } from './dto/cash-transaction.dto';

@Injectable()
export class CashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly financialService: FinancialService,
  ) {}

  async current(companyId: string, unitId: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { companyId, unitId, status: 'OPEN' },
      include: { transactions: true },
    });

    if (!register) return null;

    const entries = register.transactions
      .filter((t) => t.type === 'ENTRY')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const exits = register.transactions
      .filter((t) => t.type === 'EXIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      id: register.id,
      unitId: register.unitId,
      openedBy: register.openedBy,
      openedAt: register.openedAt,
      openingAmount: Number(register.openingAmount),
      entries,
      exits,
      currentBalance: Number(register.openingAmount) + entries - exits,
      notes: register.notes,
      transactionCount: register.transactions.length,
    };
  }

  async open(companyId: string, userId: string, dto: OpenCashDto) {
    const existing = await this.prisma.cashRegister.findFirst({
      where: { companyId, unitId: dto.unitId, status: 'OPEN' },
    });

    if (existing) {
      throw new BadRequestException('Já existe um caixa aberto nesta unidade');
    }

    const result = await this.prisma.cashRegister.create({
      data: {
        companyId,
        unitId: dto.unitId,
        openingAmount: dto.openingAmount,
        openedBy: userId,
        notes: dto.notes,
      },
    });

    if (dto.openingAmount > 0) {
      await this.prisma.cashTransaction.create({
        data: {
          companyId,
          unitId: dto.unitId,
          cashRegisterId: result.id,
          type: 'ENTRY',
          amount: dto.openingAmount,
          description: 'Abertura de caixa',
        },
      });
    }

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'CashRegister',
      entityId: result.id,
      newData: { unitId: dto.unitId, openingAmount: dto.openingAmount } as any,
    });

    return result;
  }

  async close(companyId: string, id: string, userId: string, dto: CloseCashDto) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId, status: 'OPEN' },
      include: { transactions: true },
    });

    if (!register) {
      throw new BadRequestException('Caixa não encontrado ou já está fechado');
    }

    return this.financialService.createCashClosing(companyId, userId, {
      cashRegisterId: id,
      closingAmount: dto.closingAmount,
      expectedAmount: dto.expectedAmount,
    });
  }

  async reopen(companyId: string, id: string, userId: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId, status: 'CLOSED' },
    });

    if (!register) {
      throw new BadRequestException('Caixa não encontrado ou já está aberto');
    }

    const existing = await this.prisma.cashRegister.findFirst({
      where: { companyId, unitId: register.unitId, status: 'OPEN', id: { not: id } },
    });

    if (existing) {
      throw new BadRequestException('Já existe outro caixa aberto nesta unidade');
    }

    const result = await this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'OPEN',
        closedBy: null,
        closedAt: null,
        closingAmount: null,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'CashRegister',
      entityId: id,
      oldData: { status: 'CLOSED' } as any,
      newData: { status: 'OPEN' } as any,
    });

    return result;
  }

  async supply(companyId: string, id: string, userId: string, dto: CashTransactionDto) {
    const register = await this.findOpenRegister(companyId, id);

    const tx = await this.prisma.cashTransaction.create({
      data: {
        companyId,
        unitId: register.unitId,
        cashRegisterId: id,
        type: 'ENTRY',
        amount: dto.amount,
        description: `Suprimento: ${dto.description}`,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'CashTransaction',
      entityId: tx.id,
      newData: { type: 'ENTRY', amount: dto.amount, description: dto.description } as any,
    });

    return tx;
  }

  async withdraw(companyId: string, id: string, userId: string, dto: CashTransactionDto) {
    const register = await this.findOpenRegister(companyId, id);

    const tx = await this.prisma.cashTransaction.create({
      data: {
        companyId,
        unitId: register.unitId,
        cashRegisterId: id,
        type: 'EXIT',
        amount: dto.amount,
        description: `Sangria: ${dto.description}`,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'CashTransaction',
      entityId: tx.id,
      newData: { type: 'EXIT', amount: dto.amount, description: dto.description } as any,
    });

    return tx;
  }

  async summary(companyId: string, id: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
        closings: {
          orderBy: { closedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!register) throw new NotFoundException('Caixa não encontrado');

    const entries = register.transactions
      .filter((t) => t.type === 'ENTRY')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const exits = register.transactions
      .filter((t) => t.type === 'EXIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      id: register.id,
      unitId: register.unitId,
      status: register.status,
      openedBy: register.openedBy,
      closedBy: register.closedBy,
      openedAt: register.openedAt,
      closedAt: register.closedAt,
      openingAmount: Number(register.openingAmount),
      closingAmount: register.closingAmount ? Number(register.closingAmount) : null,
      entries,
      exits,
      expectedBalance: Number(register.openingAmount) + entries - exits,
      transactionCount: register.transactions.length,
      transactions: register.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        paymentId: t.paymentId,
        createdAt: t.createdAt,
      })),
      lastClosing: register.closings[0] ?? null,
    };
  }

  async history(companyId: string, unitId?: string) {
    const where: any = { companyId };
    if (unitId) where.unitId = unitId;

    const registers = await this.prisma.cashRegister.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    return registers.map((r) => ({
      id: r.id,
      unitId: r.unitId,
      status: r.status,
      openedBy: r.openedBy,
      closedBy: r.closedBy,
      openedAt: r.openedAt,
      closedAt: r.closedAt,
      openingAmount: Number(r.openingAmount),
      closingAmount: r.closingAmount ? Number(r.closingAmount) : null,
      transactionCount: r._count.transactions,
    }));
  }

  async findOpenRegister(companyId: string, id: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, companyId, status: 'OPEN' },
    });

    if (!register) {
      throw new BadRequestException('Caixa não encontrado ou não está aberto');
    }

    return register;
  }
}

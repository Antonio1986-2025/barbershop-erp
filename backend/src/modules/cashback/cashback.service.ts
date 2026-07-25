import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const GENERATION_RATE = 0.05;

@Injectable()
export class CashbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getBalance(companyId: string, customerId: string) {
    const available = await this.prisma.cashbackTransaction.aggregate({
      where: { companyId, customerId, status: 'AVAILABLE' },
      _sum: { amount: true },
    });

    return { customerId, balance: Number(available._sum.amount ?? 0) };
  }

  async history(companyId: string, customerId: string) {
    return this.prisma.cashbackTransaction.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'desc' },
      include: { sale: { select: { id: true, total: true, createdAt: true } } },
    });
  }

  async generate(companyId: string, saleId: string, customerId: string, total: number, userId: string) {
    const amount = Math.round(total * GENERATION_RATE * 100) / 100;
    if (amount <= 0) return null;

    const result = await this.prisma.cashbackTransaction.create({
      data: {
        companyId, saleId, customerId,
        amount,
        rate: GENERATION_RATE,
        status: 'AVAILABLE',
      },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'CashbackTransaction',
      entityId: result.id,
      newData: { saleId, customerId, amount, rate: GENERATION_RATE } as any,
    });

    return result;
  }

  async redeem(companyId: string, customerId: string, saleId: string, amount: number) {
    const { balance } = await this.getBalance(companyId, customerId);

    if (amount > balance) {
      throw new BadRequestException(
        `Saldo de cashback insuficiente. Disponível: R$ ${balance.toFixed(2)}`,
      );
    }

    let remaining = amount;
    const transactions = await this.prisma.cashbackTransaction.findMany({
      where: { companyId, customerId, status: 'AVAILABLE' },
      orderBy: { createdAt: 'asc' },
    });

    for (const tx of transactions) {
      if (remaining <= 0) break;
      const txAmount = Number(tx.amount);
      const used = Math.min(txAmount, remaining);
      remaining -= used;

      await this.prisma.cashbackTransaction.update({
        where: { id: tx.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
          usedInSaleId: saleId,
        },
      });
    }

    await this.auditService.create({
      companyId, userId: '', action: 'UPDATE', entity: 'CashbackTransaction',
      entityId: saleId,
      newData: { customerId, redeemedAmount: amount, saleId } as any,
    });

    return { redeemed: amount - remaining };
  }

  async cancelBySale(companyId: string, saleId: string, status: string) {
    const txns = await this.prisma.cashbackTransaction.findMany({
      where: { companyId, saleId, status: 'AVAILABLE' },
    });

    for (const tx of txns) {
      await this.prisma.cashbackTransaction.update({
        where: { id: tx.id },
        data: { status: 'EXPIRED' },
      });
    }

    const redemptions = await this.prisma.cashbackTransaction.findMany({
      where: { usedInSaleId: saleId, status: 'USED' },
    });

    for (const tx of redemptions) {
      await this.prisma.cashbackTransaction.update({
        where: { id: tx.id },
        data: { status: 'AVAILABLE', usedAt: null, usedInSaleId: null },
      });
    }
  }

  async findBySale(companyId: string, saleId: string) {
    return this.prisma.cashbackTransaction.findMany({
      where: { companyId, saleId },
    });
  }
}

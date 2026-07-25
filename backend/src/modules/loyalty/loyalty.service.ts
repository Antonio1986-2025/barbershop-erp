import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getConfig(companyId: string) {
    let program = await this.prisma.loyaltyProgram.findUnique({
      where: { companyId },
    });

    if (!program) {
      program = await this.prisma.loyaltyProgram.create({
        data: {
          companyId,
          name: 'Programa de Fidelidade',
          pointsPerAmount: 10,
          minAmount: 0,
        },
      });
    }

    return program;
  }

  async updateConfig(
    companyId: string,
    userId: string,
    data: { name?: string; pointsPerAmount?: number; minAmount?: number; active?: boolean },
  ) {
    const existing = await this.getConfig(companyId);

    const result = await this.prisma.loyaltyProgram.upsert({
      where: { companyId },
      create: {
        companyId,
        name: data.name ?? 'Programa de Fidelidade',
        pointsPerAmount: data.pointsPerAmount ?? 10,
        minAmount: data.minAmount ?? 0,
      },
      update: data,
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'LoyaltyProgram',
      entityId: result.id,
      oldData: existing as any, newData: result as any,
    });

    return result;
  }

  async getBalance(companyId: string, customerId: string) {
    const earned = await this.prisma.loyaltyPoints.aggregate({
      where: { companyId, customerId, type: 'EARNED' },
      _sum: { points: true },
    });

    const redeemed = await this.prisma.loyaltyPoints.aggregate({
      where: { companyId, customerId, type: 'REDEEMED' },
      _sum: { points: true },
    });

    const balance = (earned._sum.points ?? 0) - (redeemed._sum.points ?? 0);

    return { customerId, balance: Math.max(0, balance) };
  }

  async earn(companyId: string, customerId: string, saleId: string, total: number) {
    const config = await this.getConfig(companyId);
    if (!config.active) return null;

    if (total < Number(config.minAmount)) return null;

    const points = Math.floor(total / Number(config.pointsPerAmount));
    if (points <= 0) return null;

    const result = await this.prisma.loyaltyPoints.create({
      data: {
        companyId, customerId, saleId,
        points,
        type: 'EARNED',
        description: `Pontos gerados pela venda ${saleId}`,
      },
    });

    return result;
  }

  async redeem(companyId: string, customerId: string, saleId: string, points: number) {
    const { balance } = await this.getBalance(companyId, customerId);

    if (points > balance) {
      throw new NotFoundException('Pontos insuficientes');
    }

    const result = await this.prisma.loyaltyPoints.create({
      data: {
        companyId, customerId, saleId,
        points: -points,
        type: 'REDEEMED',
        description: `Resgate de ${points} pontos na venda ${saleId}`,
      },
    });

    return result;
  }

  async cancelBySale(companyId: string, saleId: string) {
    const earned = await this.prisma.loyaltyPoints.findMany({
      where: { companyId, saleId, type: 'EARNED' },
    });

    for (const ep of earned) {
      await this.prisma.loyaltyPoints.create({
        data: {
          companyId, customerId: ep.customerId,
          saleId,
          points: -ep.points,
          type: 'CANCELLED',
          description: `Estorno de pontos da venda ${saleId}`,
        },
      });
    }
  }

  async history(companyId: string, customerId: string) {
    return this.prisma.loyaltyPoints.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

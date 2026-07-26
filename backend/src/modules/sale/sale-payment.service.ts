import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StockMovementService } from '../stock/stock-movement.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FinancialService } from '../financial/financial.service';
import { CashbackService } from '../cashback/cashback.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AutomationService } from '../automation/automation.service';
import { InteractionService } from '../interaction/interaction.service';
import { CommissionService } from '../commission/commission.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StockMovementType } from '@prisma/client';

const CASH_METHODS = ['CASH'];

@Injectable()
export class SalePaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly stockMovementService: StockMovementService,
    private readonly notificationsService: NotificationsService,
    private readonly financialService: FinancialService,
    private readonly cashbackService: CashbackService,
    private readonly loyaltyService: LoyaltyService,
    private readonly automationService: AutomationService,
    private readonly interactionService: InteractionService,
    private readonly commissionService: CommissionService,
  ) {}

  async findBySale(companyId: string, saleId: string) {
    return this.prisma.payment.findMany({
      where: { saleId, companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId },
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  async create(
    companyId: string,
    saleId: string,
    userId: string,
    dto: CreatePaymentDto,
  ) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, companyId },
      include: {
        payments: true,
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!sale) throw new NotFoundException('Venda não encontrada');

    if (sale.status !== 'OPEN' && sale.status !== 'DRAFT') {
      throw new BadRequestException(
        `Venda não aceita pagamentos. Status: ${sale.status}`,
      );
    }

    const totalPaid = sale.payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const remaining = Number(sale.total) - totalPaid;

    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Valor excede o saldo restante de ${remaining.toFixed(2)}`,
      );
    }

    const willComplete = dto.amount >= remaining;

    if (CASH_METHODS.includes(dto.paymentMethod)) {
      const openRegister = await this.prisma.cashRegister.findFirst({
        where: { companyId, unitId: sale.unitId, status: 'OPEN' },
      });

      if (!openRegister) {
        throw new BadRequestException(
          'Caixa não está aberto. Abra o caixa antes de receber pagamentos em dinheiro.',
        );
      }
    }

    if (willComplete) {
      await this.checkStockAvailability(companyId, sale);
    }

    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        unitId: sale.unitId,
        saleId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod as any,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // 1️⃣ Criar CashTransaction para TODO pagamento em dinheiro (não só no completo)
    if (CASH_METHODS.includes(dto.paymentMethod)) {
      const register = await this.prisma.cashRegister.findFirst({
        where: { companyId, unitId: sale.unitId, status: 'OPEN' },
      });
      if (register) {
        await this.prisma.cashTransaction.create({
          data: {
            companyId,
            unitId: sale.unitId,
            cashRegisterId: register.id,
            paymentId: payment.id,
            type: 'ENTRY',
            amount: Number(dto.amount),
            description: `Pagamento ${payment.id.slice(0, 8)} - Venda ${saleId.slice(0, 8)}`,
          },
        });

        await this.auditService.create({
          companyId,
          userId,
          action: 'CREATE',
          entity: 'CashTransaction',
          entityId: payment.id,
          newData: {
            saleId,
            paymentId: payment.id,
            amount: Number(dto.amount),
            type: 'ENTRY',
          } as any,
        });
      }
    }

    // 2️⃣ Criar FinancialAccount na PRIMEIRA parcela (idempotente)
    const existingAccount = await this.prisma.financialAccount.findFirst({
      where: {
        companyId,
        description: `Venda ${saleId}`,
        type: 'RECEIVABLE',
      },
    });
    if (!existingAccount) {
      await this.createFinancialRecords(companyId, sale, userId);
    }

    // 3️⃣ Ações exclusivas do pagamento COMPLETO
    if (willComplete) {
      await this.deductStock(companyId, sale, userId);

      if (sale.customerId) {
        await this.cashbackService.generate(companyId, saleId, sale.customerId, Number(sale.total), userId);
        await this.loyaltyService.earn(companyId, sale.customerId, saleId, Number(sale.total));
        await this.automationService.onSalePaid({
          companyId, saleId, customerId: sale.customerId, userId,
        });
      }

      await this.prisma.sale.update({
        where: { id: saleId },
        data: { status: 'PAID', updatedBy: userId },
      });

      await this.notificationsService.create(companyId, userId, {
        companyId,
        userId,
        type: 'SALE_COMPLETED',
        title: 'Venda concluída',
        message: `Venda ${saleId} finalizada. Total: R$ ${Number(sale.total).toFixed(2)}`,
      });

      // Calculate commission automatically
      this.commissionService.calculateForSale(companyId, saleId).catch((err) =>
        console.error('[Commission] Error calculating commission for sale', saleId, err?.message),
      );

      if (sale.customerId) {
        this.interactionService
          .create(companyId, userId, {
            customerId: sale.customerId,
            saleId,
            type: 'NOTE',
            subject: 'Venda concluída',
            description: `Venda finalizada. Total: R$ ${Number(sale.total).toFixed(2)}`,
            interactionAt: new Date().toISOString(),
          })
          .catch(e => console.error('[InteractionService] venda:', e.message));
      }
    }

    // Interaction para pagamento confirmado (todo pagamento, mesmo parcial)
    if (sale.customerId) {
      this.interactionService
        .create(companyId, userId, {
          customerId: sale.customerId,
          saleId,
          type: 'NOTE',
          subject: 'Pagamento confirmado',
          description: `Pagamento de R$ ${Number(dto.amount).toFixed(2)} via ${dto.paymentMethod}`,
          interactionAt: new Date().toISOString(),
        })
        .catch(e => console.error('[InteractionService] pagamento:', e.message));
    }

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'payment',
      entityId: payment.id,
      newData: {
        saleId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        status: 'PAID',
      } as any,
    });

    return payment;
  }

  async cancel(companyId: string, id: string, userId: string) {
    const payment = await this.findOne(companyId, id);

    if (payment.status === 'CANCELED') {
      throw new BadRequestException('Pagamento já está cancelado');
    }

    if (payment.status === 'REFUNDED') {
      throw new BadRequestException(
        'Pagamento reembolsado não pode ser cancelado',
      );
    }

    const result = await this.prisma.payment.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    if (payment.saleId) {
      await this.recalculateSaleStatus(payment.saleId, userId);
    }

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      oldData: { status: payment.status } as any,
      newData: { status: 'CANCELED' } as any,
    });

    return result;
  }

  async refund(companyId: string, id: string, userId: string) {
    const payment = await this.findOne(companyId, id);

    if (payment.status === 'REFUNDED') {
      throw new BadRequestException('Pagamento já foi reembolsado');
    }

    if (payment.status === 'CANCELED') {
      throw new BadRequestException(
        'Pagamento cancelado não pode ser reembolsado',
      );
    }

    const result = await this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    if (payment.saleId) {
      await this.recalculateSaleStatus(payment.saleId, userId);
    }

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      oldData: { status: payment.status } as any,
      newData: { status: 'REFUNDED' } as any,
    });

    return result;
  }

  private async checkStockAvailability(
    companyId: string,
    sale: any,
  ) {
    const productItems = sale.items.filter((i: any) => i.productId);
    if (productItems.length === 0) return;

    for (const item of productItems) {
      const stock = await this.prisma.stock.findUnique({
        where: {
          companyId_unitId_productId: {
            companyId,
            unitId: sale.unitId,
            productId: item.productId,
          },
        },
      });

      const qty = Number(item.quantity);
      const available = stock ? Number(stock.quantity) : 0;

      if (qty > available) {
        throw new BadRequestException(
          `Estoque insuficiente para ${item.productName}: disponível ${available}, necessário ${qty}`,
        );
      }
    }
  }

  private async deductStock(
    companyId: string,
    sale: any,
    userId: string,
  ) {
    const productItems = sale.items.filter((i: any) => i.productId);

    for (const item of productItems) {
      // Busca o custo medio atual para registrar como snapshot na saida
      const stock = await this.prisma.stock.findUnique({
        where: {
          companyId_unitId_productId: {
            companyId,
            unitId: sale.unitId,
            productId: item.productId,
          },
        },
        select: { avgCost: true },
      });
      const unitCost = stock ? Number(stock.avgCost) : 0;
      const totalCost = unitCost * Number(item.quantity);

      await this.stockMovementService.recordMovement({
        companyId,
        unitId: sale.unitId,
        productId: item.productId,
        type: StockMovementType.SALE,
        quantity: Number(item.quantity),
        unitCost,
        totalCost,
        referenceId: sale.id,
        referenceType: 'sale',
        description: `Venda ${sale.id} - ${item.productName}`,
        userId,
      });
    }
  }

  private async createFinancialRecords(
    companyId: string,
    sale: any,
    userId: string,
  ) {
    const categoryId = await this.getOrCreateSalesCategory(companyId, userId);

    await this.financialService.createAccount(companyId, userId, {
      categoryId,
      description: `Venda ${sale.id}`,
      type: 'RECEIVABLE',
      amount: Number(sale.total),
      dueDate: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'FinancialAccount',
      entityId: sale.id,
      newData: { saleId: sale.id, amount: Number(sale.total), type: 'RECEIVABLE' } as any,
    });
  }

  private async getOrCreateSalesCategory(companyId: string, userId: string): Promise<string> {
    let category = await this.prisma.financialCategory.findFirst({
      where: { companyId, type: 'INCOME', name: 'Vendas', active: true },
    });

    if (!category) {
      category = await this.prisma.financialCategory.findFirst({
        where: { companyId, type: 'INCOME', active: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!category) {
      category = await this.prisma.financialCategory.create({
        data: {
          companyId,
          name: 'Vendas',
          type: 'INCOME',
        },
      });
    }

    return category.id;
  }

  private async recalculateSaleStatus(saleId: string, userId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { payments: true },
    });

    if (!sale) return;

    const totalPaid = sale.payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    if (totalPaid <= 0 && sale.status === 'PAID') {
      await this.prisma.sale.update({
        where: { id: saleId },
        data: { status: 'OPEN', updatedBy: userId },
      });
    }
  }
}

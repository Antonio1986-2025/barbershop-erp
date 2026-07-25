import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TaskService } from '../task/task.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly taskService: TaskService,
    private readonly auditService: AuditService,
  ) {}

  async onSalePaid(params: { companyId: string; saleId: string; customerId?: string | null; userId: string }) {
    if (!params.customerId) return;
    const customerId: string = params.customerId;
    await this.execute('SalePaid', 'followUpTask', 'sale', params, async () => {
      await this.taskService.create(params.companyId, params.userId, {
        customerId,
        assignedTo: params.userId,
        type: 'FOLLOW_UP',
        title: 'Follow-up pós-venda',
        description: 'Cliente realizou uma compra. Verificar satisfação e oportunidade de retorno.',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
    });
  }

  async onAppointmentCompleted(companyId: string, customerId: string, appointmentId: string, userId: string) {
    await this.execute('AppointmentCompleted', 'returnReminder', 'appointment', { companyId, customerId, appointmentId }, async () => {
      await this.taskService.create(companyId, userId, {
        customerId,
        assignedTo: userId,
        type: 'REMINDER',
        title: 'Lembrete de retorno',
        description: 'Cliente realizou um atendimento. Agendar retorno se necessário.',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkBirthdays() {
    await this.execute('CustomerBirthday', 'birthdayNotification', 'crm', {}, async () => {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const customers = await this.prisma.customer.findMany({
        where: { birthDate: { not: null }, active: true },
        select: { id: true, name: true, companyId: true, birthDate: true },
      });
      for (const c of customers) {
        if (!c.birthDate) continue;
        const bd = new Date(c.birthDate);
        if (bd.getDate() === day && bd.getMonth() + 1 === month) {
          await this.notificationsService.create(c.companyId, 'system', {
            companyId: c.companyId,
            type: 'APPOINTMENT_REMINDER',
            title: 'Aniversário do cliente',
            message: `${c.name} está fazendo aniversário hoje!`,
          }).catch(() => {});
        }
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkInactiveCustomers() {
    await this.execute('CustomerInactive', 'inactiveCustomerTask', 'crm', {}, async () => {
      const threshold = new Date(Date.now() - 180 * 86400000);
      const customers = await this.prisma.customer.findMany({
        where: { active: true, sales: { none: { status: 'PAID', createdAt: { gte: threshold } } } },
        select: { id: true, name: true, companyId: true },
        take: 50,
      });
      for (const c of customers) {
        const existing = await this.prisma.customerTask.findFirst({
          where: { customerId: c.id, type: 'FOLLOW_UP', title: { contains: 'inativo' }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        });
        if (existing) continue;
        const admins = await this.prisma.user.findMany({
          where: { companyId: c.companyId, active: true },
          select: { id: true },
          take: 1,
        });
        if (admins.length > 0) {
          await this.taskService.create(c.companyId, admins[0].id, {
            customerId: c.id, assignedTo: admins[0].id,
            type: 'FOLLOW_UP', title: 'Cliente inativo — retorno',
            description: `Cliente ${c.name} sem compras há mais de 6 meses.`,
            priority: 'LOW',
          });
        }
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkOverdueTasks() {
    await this.execute('TaskOverdue', 'overdueTaskAlert', 'task', {}, async () => {
      const overdue = await this.prisma.customerTask.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } },
        select: { id: true, title: true, companyId: true, assignedTo: true, dueDate: true },
        take: 100,
      });
      for (const task of overdue) {
        if (!task.dueDate) continue;
        const daysOverdue = Math.floor((Date.now() - task.dueDate.getTime()) / 86400000);
        await this.notificationsService.create(task.companyId, task.assignedTo, {
          companyId: task.companyId, userId: task.assignedTo,
          type: 'APPOINTMENT_REMINDER',
          title: 'Tarefa vencida',
          message: `"${task.title}" está ${daysOverdue} dia(s) atrasada.`,
        }).catch(() => {});
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringCoupons() {
    await this.execute('CouponExpiring', 'expiringCouponNotification', 'coupon', {}, async () => {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);
      const coupons = await this.prisma.coupon.findMany({
        where: { active: true, expiresAt: { lte: sevenDaysFromNow, gte: new Date() } },
        select: { id: true, code: true, companyId: true, expiresAt: true },
      });
      for (const c of coupons) {
        await this.notificationsService.create(c.companyId, 'system', {
          companyId: c.companyId,
          type: 'APPOINTMENT_REMINDER',
          title: 'Cupom próximo do vencimento',
          message: `Cupom ${c.code} expira em ${c.expiresAt?.toLocaleDateString('pt-BR')}.`,
        }).catch(() => {});
      }
    });
  }

  private async execute(
    eventName: string,
    ruleName: string,
    sourceModule: string,
    payload: any,
    fn: () => Promise<void>,
  ) {
    const start = Date.now();
    try {
      await fn();
      await this.prisma.automationExecution.create({
        data: {
          eventName, ruleName, sourceModule,
          payload: JSON.stringify(payload),
          status: 'SUCCESS',
          durationMs: Date.now() - start,
        },
      });
    } catch (err: any) {
      await this.prisma.automationExecution.create({
        data: {
          eventName, ruleName, sourceModule,
          payload: JSON.stringify(payload),
          status: 'FAILED',
          error: err.message ?? String(err),
          durationMs: Date.now() - start,
        },
      });
      this.logger.error(`[${eventName}] ${ruleName}: ${err.message}`);
    }
  }
}

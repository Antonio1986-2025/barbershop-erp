import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId: string, filter: TaskFilterDto) {
    const page = Math.max(1, parseInt(filter.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(filter.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.dueToday === 'true') {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      where.dueDate = { gte: start, lt: end };
    }
    if (filter.overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'COMPLETED' };
    }

    const [data, total] = await Promise.all([
      this.prisma.customerTask.findMany({
        where, skip, take: limit,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        include: { customer: { select: { id: true, name: true } } },
      }),
      this.prisma.customerTask.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(companyId: string, id: string) {
    const task = await this.prisma.customerTask.findFirst({
      where: { id, companyId },
      include: { customer: { select: { id: true, name: true } } },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return task;
  }

  async create(companyId: string, userId: string, dto: CreateTaskDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const result = await this.prisma.customerTask.create({
      data: {
        companyId,
        customerId: dto.customerId,
        assignedTo: dto.assignedTo,
        type: dto.type as any,
        priority: (dto.priority ?? 'MEDIUM') as any,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        metadata: dto.metadata,
        createdBy: userId,
      },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'CustomerTask', entityId: result.id,
      newData: { customerId: dto.customerId, type: dto.type, title: dto.title, priority: dto.priority ?? 'MEDIUM' } as any,
    });

    return result;
  }

  async update(companyId: string, id: string, userId: string, dto: UpdateTaskDto) {
    const old = await this.findOne(companyId, id);

    if (old.status === 'COMPLETED' || old.status === 'CANCELLED') {
      throw new BadRequestException('Tarefa concluída ou cancelada não pode ser editada');
    }

    const data: any = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);

    const result = await this.prisma.customerTask.update({ where: { id }, data });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'CustomerTask', entityId: id,
      oldData: old as any, newData: result as any,
    });

    return result;
  }

  async complete(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);

    if (old.status === 'COMPLETED') {
      throw new BadRequestException('Tarefa já está concluída');
    }

    const result = await this.prisma.customerTask.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date(), completedBy: userId },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'CustomerTask', entityId: id,
      oldData: old as any, newData: result as any,
    });

    return result;
  }

  async cancel(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);

    if (old.status === 'CANCELLED') {
      throw new BadRequestException('Tarefa já está cancelada');
    }

    const result = await this.prisma.customerTask.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'CustomerTask', entityId: id,
      oldData: old as any, newData: result as any,
    });

    return result;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from '../../../src/modules/task/task.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TaskService', () => {
  let service: TaskService;
  let prisma: any;

  const mockTask = {
    id: 'task-1',
    companyId: 'company-1',
    customerId: 'cust-1',
    assignedTo: 'user-2',
    type: 'FOLLOW_UP',
    priority: 'HIGH',
    status: 'OPEN',
    title: 'Retornar ligação',
    description: 'Cliente aguarda retorno sobre orçamento',
    dueDate: new Date(Date.now() + 86400000),
    completedAt: null,
    completedBy: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    customer: { id: 'cust-1', name: 'João' },
  };

  beforeEach(async () => {
    prisma = {
      customerTask: {
        findMany: jest.fn().mockResolvedValue([mockTask]),
        findFirst: jest.fn().mockResolvedValue(mockTask),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockTask),
        update: jest.fn().mockResolvedValue({ ...mockTask, status: 'COMPLETED', completedAt: new Date(), completedBy: 'user-1' }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', companyId: 'company-1' }),
      },
    };

    const auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  it('deve listar tarefas', async () => {
    const result = await service.findAll('company-1', {});
    expect(result.data).toHaveLength(1);
  });

  it('deve criar tarefa', async () => {
    const result = await service.create('company-1', 'user-1', {
      customerId: 'cust-1', assignedTo: 'user-2', type: 'FOLLOW_UP', title: 'Teste',
    } as any);
    expect(result.id).toBe('task-1');
  });

  it('deve concluir tarefa', async () => {
    const result = await service.complete('company-1', 'task-1', 'user-1');
    expect(result.status).toBe('COMPLETED');
  });

  it('deve lancar erro ao concluir ja concluida', async () => {
    prisma.customerTask.findFirst.mockResolvedValue({ ...mockTask, status: 'COMPLETED' });
    await expect(service.complete('company-1', 'task-1', 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('deve lancar NotFoundException', async () => {
    prisma.customerTask.findFirst.mockResolvedValue(null);
    await expect(service.findOne('company-1', 'not-found')).rejects.toThrow(NotFoundException);
  });
});

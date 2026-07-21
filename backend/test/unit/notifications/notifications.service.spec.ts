import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let auditService: any;

  const mockNotification = {
    id: 'notif-1',
    companyId: 'company-1',
    userId: 'user-1',
    customerId: null,
    type: 'APPOINTMENT_CREATED',
    channel: 'INTERNAL',
    title: 'Novo Agendamento',
    message: 'Agendamento criado para João',
    status: 'PENDING',
    scheduledAt: null,
    sentAt: null,
    readAt: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: null,
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      notification: {
        findMany: jest.fn().mockResolvedValue([mockNotification]),
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockNotification),
        update: jest.fn().mockResolvedValue(mockNotification),
      },
    };

    auditService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      prisma.$transaction.mockResolvedValue([[mockNotification], 1]);
      const result = await service.findAll('company-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve filtrar por status', async () => {
      prisma.$transaction.mockResolvedValue([[mockNotification], 1]);
      await service.findAll('company-1', { status: 'PENDING' });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('deve filtrar por tipo', async () => {
      prisma.$transaction.mockResolvedValue([[mockNotification], 1]);
      await service.findAll('company-1', { type: 'APPOINTMENT_CREATED' });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'APPOINTMENT_CREATED' }),
        }),
      );
    });

    it('deve filtrar por canal', async () => {
      prisma.$transaction.mockResolvedValue([[mockNotification], 1]);
      await service.findAll('company-1', { channel: 'INTERNAL' });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ channel: 'INTERNAL' }),
        }),
      );
    });

    it('deve filtrar por data', async () => {
      prisma.$transaction.mockResolvedValue([[mockNotification], 1]);
      await service.findAll('company-1', {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('deve respeitar limite máximo de 100', async () => {
      prisma.$transaction.mockResolvedValue([[mockNotification], 1]);
      await service.findAll('company-1', { limit: '999' });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar notificação', async () => {
      prisma.notification.findFirst.mockResolvedValue(mockNotification);
      const result = await service.findOne('company-1', 'notif-1');
      expect(result.title).toBe('Novo Agendamento');
    });

    it('deve lançar NotFoundException', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);
      await expect(
        service.findOne('company-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar notificação', async () => {
      const result = await service.create('company-1', 'user-1', {
        companyId: 'company-1',
        type: 'APPOINTMENT_CREATED',
        title: 'Teste',
        message: 'Mensagem de teste',
      });
      expect(result.title).toBe('Novo Agendamento');
    });

    it('deve registrar auditoria quando userId fornecido', async () => {
      await service.create('company-1', 'user-1', {
        companyId: 'company-1',
        type: 'APPOINTMENT_CREATED',
        title: 'Teste',
        message: 'Mensagem',
      });
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE' }),
      );
    });

    it('não deve auditar quando userId é undefined', async () => {
      await service.create('company-1', undefined, {
        companyId: 'company-1',
        type: 'APPOINTMENT_CREATED',
        title: 'Teste',
        message: 'Mensagem',
      });
      expect(auditService.create).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('deve marcar como lida', async () => {
      prisma.notification.findFirst.mockResolvedValue(mockNotification);
      const result = await service.markAsRead('company-1', 'notif-1', 'user-1');
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: expect.objectContaining({ status: 'READ' }),
        }),
      );
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' }),
      );
    });

    it('deve retornar notificação já lida sem auditar novamente', async () => {
      prisma.notification.findFirst.mockResolvedValue({
        ...mockNotification,
        readAt: new Date(),
      });
      const result = await service.markAsRead('company-1', 'notif-1', 'user-1');
      expect(result.readAt).toBeDefined();
      expect(prisma.notification.update).not.toHaveBeenCalled();
      expect(auditService.create).not.toHaveBeenCalled();
    });
  });

  describe('countUnread', () => {
    it('deve retornar contagem de não lidas', async () => {
      const result = await service.countUnread('company-1');
      expect(result).toBe(1);
      expect(prisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1', status: { not: 'READ' } },
        }),
      );
    });
  });

  describe('send', () => {
    it('deve enviar notificação', async () => {
      const result = await service.send('notif-1');
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });
  });

  describe('schedule', () => {
    it('deve criar notificação agendada', async () => {
      const futureDate = new Date('2026-12-31');
      const result = await service.schedule({
        companyId: 'company-1',
        userId: 'user-1',
        type: 'APPOINTMENT_REMINDER',
        title: 'Lembrete',
        message: 'Você tem um agendamento amanhã',
        scheduledAt: futureDate,
      });
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            scheduledAt: futureDate,
          }),
        }),
      );
    });
  });

  describe('createFromAppointment', () => {
    const appointment = {
      id: 'apt-1',
      companyId: 'company-1',
      customerId: 'cust-1',
      customer: { name: 'João' },
      professionalId: 'prof-1',
      professional: { name: 'Carlos' },
      service: { name: 'Corte' },
      startAt: new Date('2026-08-01T09:00:00Z'),
      createdBy: 'user-1',
    };

    it('deve criar notificações para cliente e profissional', async () => {
      const result = await service.createFromAppointment(
        'company-1',
        appointment,
        'APPOINTMENT_CREATED',
      );
      expect(result).toHaveLength(2);
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
    });

    it('deve criar notificação apenas para cliente quando sem profissional', async () => {
      const aptSemProf = { ...appointment, professional: null };
      const result = await service.createFromAppointment(
        'company-1',
        aptSemProf,
        'APPOINTMENT_CANCELLED',
      );
      expect(result).toHaveLength(1);
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('deve gerar título e mensagem em português', async () => {
      await service.createFromAppointment(
        'company-1',
        appointment,
        'APPOINTMENT_CONFIRMED',
      );
      const call = prisma.notification.create.mock.calls[0][0];
      expect(call.data.title).toBe('Agendamento Confirmado');
    });
  });
});

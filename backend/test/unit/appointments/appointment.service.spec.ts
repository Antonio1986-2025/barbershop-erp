import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from '../../../src/modules/appointment/appointment.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prisma: any;
  let auditService: any;
  let notificationsService: any;

  const mockService = {
    id: 'svc-1',
    name: 'Corte',
    durationMinutes: 45,
    price: 50,
    companyId: 'company-1',
  };

  const mockAppointment = {
    id: 'apt-1',
    companyId: 'company-1',
    unitId: 'unit-1',
    professionalId: 'prof-1',
    customerId: 'cust-1',
    serviceId: 'svc-1',
    startAt: new Date('2026-08-01T09:00:00Z'),
    endAt: new Date('2026-08-01T09:45:00Z'),
    status: 'SCHEDULED',
    notes: null,
    cancellationReason: null,
    cancelledAt: null,
    cancelledBy: null,
    rescheduledFromId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    professional: { id: 'prof-1', name: 'Carlos' },
    customer: { id: 'cust-1', name: 'João' },
    service: { id: 'svc-1', name: 'Corte' },
    unit: { id: 'unit-1', name: 'Unidade Centro' },
  };

  const baseFindFirst = jest.fn();

  beforeEach(async () => {
    baseFindFirst.mockReset();
    prisma = {
      service: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      appointment: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockAppointment]),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(mockAppointment),
        update: jest.fn().mockResolvedValue(mockAppointment),
      },
    };

    auditService = { create: jest.fn() };
    notificationsService = {
      createFromAppointment: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('deve retornar lista com includes', async () => {
      const result = await service.findAll('company-1', {});
      expect(result).toHaveLength(1);
      expect(result[0].professional).toBeDefined();
      expect(result[0].customer).toBeDefined();
      expect(result[0].service).toBeDefined();
      expect(result[0].unit).toBeDefined();
    });

    it('deve filtrar por status', async () => {
      await service.findAll('company-1', { status: 'SCHEDULED' });
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SCHEDULED' }),
        }),
      );
    });

    it('deve filtrar por data', async () => {
      await service.findAll('company-1', {
        startDate: '2026-08-01',
        endDate: '2026-08-02',
      });
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startAt: { gte: expect.any(Date), lt: expect.any(Date) },
          }),
        }),
      );
    });

    it('deve excluir deletados', async () => {
      await service.findAll('company-1', {});
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar agendamento', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      const result = await service.findOne('company-1', 'apt-1');
      expect(result.id).toBe('apt-1');
    });

    it('deve lançar NotFoundException', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      unitId: 'unit-1',
      professionalId: 'prof-1',
      customerId: 'cust-1',
      serviceId: 'svc-1',
      startAt: '2026-08-01T10:00:00Z',
    };

    it('deve criar agendamento com sucesso', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.findFirst.mockResolvedValue(null);
      const result = await service.create('company-1', 'user-1', dto);
      expect(result.status).toBe('SCHEDULED');
    });

    it('deve calcular endAt baseado na duração do serviço', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.findFirst.mockResolvedValue(null);
      await service.create('company-1', 'user-1', dto);
      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startAt: new Date('2026-08-01T10:00:00Z'),
            endAt: new Date('2026-08-01T10:45:00Z'),
          }),
        }),
      );
    });

    it('deve lançar NotFoundException para serviço inexistente', async () => {
      prisma.service.findFirst.mockResolvedValue(null);
      await expect(service.create('company-1', 'user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException para conflito de horário', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      await expect(service.create('company-1', 'user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve criar notificação APPOINTMENT_CREATED', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.findFirst.mockResolvedValue(null);
      await service.create('company-1', 'user-1', dto);
      expect(notificationsService.createFromAppointment).toHaveBeenCalledWith(
        'company-1',
        expect.any(Object),
        'APPOINTMENT_CREATED',
      );
    });

    it('deve registrar auditoria', async () => {
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.findFirst.mockResolvedValue(null);
      await service.create('company-1', 'user-1', dto);
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE' }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar dados básicos', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      await service.update('company-1', 'apt-1', 'user-1', {
        notes: 'Nova observação',
      });
      expect(prisma.appointment.update).toHaveBeenCalled();
    });

    it('deve recalcular endAt se startAt for alterado', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      prisma.service.findUnique.mockResolvedValue(mockService);
      await service.update('company-1', 'apt-1', 'user-1', {
        startAt: '2026-08-01T14:00:00Z',
      });
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startAt: new Date('2026-08-01T14:00:00Z'),
            endAt: new Date('2026-08-01T14:45:00Z'),
          }),
        }),
      );
    });

    it('deve lançar NotFoundException', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(
        service.update('company-1', 'invalid', 'user-1', { notes: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('deve cancelar agendamento', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELED',
        cancellationReason: 'Cliente desistiu',
      });
      const result = await service.cancel('company-1', 'apt-1', 'user-1', {
        reason: 'Cliente desistiu',
      });
      expect(result.status).toBe('CANCELED');
    });

    it('deve lançar BadRequestException se já cancelado', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELED',
      });
      await expect(
        service.cancel('company-1', 'apt-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se já concluído', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: 'COMPLETED',
      });
      await expect(
        service.cancel('company-1', 'apt-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar notificação APPOINTMENT_CANCELLED', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELED',
      });
      await service.cancel('company-1', 'apt-1', 'user-1', { reason: 'Teste' });
      expect(notificationsService.createFromAppointment).toHaveBeenCalledWith(
        'company-1',
        expect.any(Object),
        'APPOINTMENT_CANCELLED',
      );
    });
  });

  describe('reschedule', () => {
    it('deve criar novo agendamento e cancelar o original', async () => {
      prisma.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(mockAppointment); // findOne + service.findUnique-like pattern
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.appointment.create.mockResolvedValue({
        ...mockAppointment,
        id: 'apt-2',
        startAt: new Date('2026-08-02T10:00:00Z'),
      });

      const result = await service.reschedule('company-1', 'apt-1', 'user-1', {
        newStartAt: '2026-08-02T10:00:00Z',
      });

      expect(result.id).toBe('apt-2');
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'apt-1' },
          data: expect.objectContaining({ status: 'CANCELED' }),
        }),
      );
    });

    it('deve lançar BadRequestException se já cancelado', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELED',
      });
      await expect(
        service.reschedule('company-1', 'apt-1', 'user-1', {
          newStartAt: '2026-08-02T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se já concluído', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: 'COMPLETED',
      });
      await expect(
        service.reschedule('company-1', 'apt-1', 'user-1', {
          newStartAt: '2026-08-02T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar notificação APPOINTMENT_RESCHEDULED', async () => {
      prisma.appointment.findFirst
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(mockAppointment);
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.appointment.create.mockResolvedValue({
        ...mockAppointment,
        id: 'apt-2',
      });

      await service.reschedule('company-1', 'apt-1', 'user-1', {
        newStartAt: '2026-08-02T10:00:00Z',
      });

      expect(notificationsService.createFromAppointment).toHaveBeenCalledWith(
        'company-1',
        expect.any(Object),
        'APPOINTMENT_RESCHEDULED',
      );
    });
  });

  describe('updateStatus', () => {
    it('deve confirmar agendamento', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'CONFIRMED',
      });
      const result = await service.updateStatus(
        'company-1',
        'apt-1',
        'user-1',
        'CONFIRMED',
      );
      expect(result.status).toBe('CONFIRMED');
    });

    it('deve concluir agendamento', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'COMPLETED',
      });
      const result = await service.updateStatus(
        'company-1',
        'apt-1',
        'user-1',
        'COMPLETED',
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('deve criar notificação APPOINTMENT_CONFIRMED ao confirmar', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'CONFIRMED',
      });
      await service.updateStatus('company-1', 'apt-1', 'user-1', 'CONFIRMED');
      expect(notificationsService.createFromAppointment).toHaveBeenCalledWith(
        'company-1',
        expect.any(Object),
        'APPOINTMENT_CONFIRMED',
      );
    });

    it('não deve criar notificação para COMPLETED', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: 'COMPLETED',
      });
      await service.updateStatus('company-1', 'apt-1', 'user-1', 'COMPLETED');
      expect(notificationsService.createFromAppointment).not.toHaveBeenCalled();
    });
  });

  describe('softRemove', () => {
    it('deve marcar deletedAt', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      await service.softRemove('company-1', 'apt-1', 'user-1');
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('deve registrar auditoria', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      await service.softRemove('company-1', 'apt-1', 'user-1');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE' }),
      );
    });
  });

  describe('findByDateRange', () => {
    it('deve retornar agendamentos no período', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
      const result = await service.findByDateRange(
        'company-1',
        '2026-08-01',
        '2026-08-31',
      );
      expect(result).toHaveLength(1);
    });

    it('deve filtrar por unitId', async () => {
      await service.findByDateRange(
        'company-1',
        '2026-08-01',
        '2026-08-31',
        'unit-1',
      );
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unitId: 'unit-1' }),
        }),
      );
    });

    it('deve filtrar por professionalId', async () => {
      await service.findByDateRange(
        'company-1',
        '2026-08-01',
        '2026-08-31',
        undefined,
        'prof-1',
      );
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ professionalId: 'prof-1' }),
        }),
      );
    });
  });
});

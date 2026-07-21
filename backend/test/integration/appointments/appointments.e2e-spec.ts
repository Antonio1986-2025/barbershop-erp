import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;
  let companyId: string;
  let unitId: string;
  let professionalId: string;
  let customerId: string;
  let serviceId: string;
  let createdIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);
    const company = await prisma.company.findFirst();
    companyId = company!.id;

    customerId =
      (await prisma.customer.findFirst({ where: { companyId } }))?.id ??
      (
        await prisma.customer.create({
          data: {
            companyId,
            name: 'Cliente Teste',
            email: `cli${Date.now()}@test.com`,
          },
        })
      ).id;

    unitId =
      (await prisma.unit.findFirst({ where: { companyId } }))?.id ??
      (
        await prisma.unit.create({
          data: { companyId, name: 'Unidade Teste', code: `TST-${Date.now()}` },
        })
      ).id;

    professionalId =
      (await prisma.professional.findFirst({ where: { companyId } }))?.id ??
      (
        await prisma.professional.create({
          data: {
            companyId,
            name: 'Prof Teste',
            email: `prof-apt${Date.now()}@test.com`,
          },
        })
      ).id;

    serviceId =
      (await prisma.service.findFirst({ where: { companyId } }))?.id ??
      (
        await prisma.service.create({
          data: {
            companyId,
            name: 'Serviço Teste',
            durationMinutes: 60,
            price: 50,
          },
        })
      ).id;
  });

  afterEach(async () => {
    for (const id of createdIds) {
      await prisma.auditLog
        .deleteMany({ where: { entityId: id } })
        .catch(() => {});
      await prisma.appointment
        .update({
          where: { id },
          data: { deletedAt: null, rescheduledFromId: null },
        })
        .catch(() => {});
      await prisma.appointment.delete({ where: { id } }).catch(() => {});
    }
    createdIds = [];
  });

  afterAll(async () => {
    await app.close();
  });

  const makeApt = (overrides: Record<string, any> = {}) => {
    const startAt =
      overrides.startAt ??
      (() => {
        const d = new Date(Date.now() + 86400000);
        d.setHours(10, 0, 0, 0);
        return d;
      })();

    return request(httpServer)
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        unitId: overrides.unitId ?? unitId,
        professionalId: overrides.professionalId ?? professionalId,
        customerId: overrides.customerId ?? customerId,
        serviceId: overrides.serviceId ?? serviceId,
        startAt: startAt.toISOString(),
      });
  };

  describe('POST /appointments', () => {
    it('deve criar agendamento (201)', async () => {
      const res = await makeApt();
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('SCHEDULED');
      createdIds.push(res.body.id);
    });

    it('deve retornar 400 para payload inválido', async () => {
      await request(httpServer)
        .post('/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /appointments/:id/cancel', () => {
    it('deve cancelar agendamento (201)', async () => {
      const { body: apt } = await makeApt();
      createdIds.push(apt.id);
      const res = await request(httpServer)
        .post(`/appointments/${apt.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Cliente desistiu' })
        .expect(201);
      expect(res.body.status).toBe('CANCELED');
    });
  });

  describe('POST /appointments/:id/reschedule', () => {
    it('deve reagendar (201)', async () => {
      const { body: apt } = await makeApt();
      createdIds.push(apt.id);
      const novaData = new Date(Date.now() + 2 * 86400000);
      novaData.setHours(14, 0, 0, 0);

      const res = await request(httpServer)
        .post(`/appointments/${apt.id}/reschedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          newStartAt: novaData.toISOString(),
          reason: 'Mudança de horário',
        })
        .expect(201);
      expect(res.body.id).not.toBe(apt.id);
      expect(res.body.status).toBe('SCHEDULED');
    });
  });

  describe('PATCH /appointments/:id/status', () => {
    it('deve confirmar agendamento (200)', async () => {
      const { body: apt } = await makeApt();
      createdIds.push(apt.id);
      const res = await request(httpServer)
        .patch(`/appointments/${apt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);
      expect(res.body.status).toBe('CONFIRMED');
    });

    it('deve percorrer fluxo CONFIRMED -> IN_PROGRESS -> COMPLETED', async () => {
      const { body: apt } = await makeApt();
      createdIds.push(apt.id);
      await request(httpServer)
        .patch(`/appointments/${apt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);
      await request(httpServer)
        .patch(`/appointments/${apt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);
      const done = await request(httpServer)
        .patch(`/appointments/${apt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' })
        .expect(200);
      expect(done.body.status).toBe('COMPLETED');
    });
  });

  describe('GET /appointments', () => {
    it('deve listar agendamentos (200)', async () => {
      const { body: apt } = await makeApt();
      createdIds.push(apt.id);
      const res = await request(httpServer)
        .get('/appointments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /appointments/calendar', () => {
    it('deve retornar agendamentos por período (200)', async () => {
      const res = await request(httpServer)
        .get('/appointments/calendar?startDate=2026-01-01&endDate=2027-01-01')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('deve remover agendamento (200)', async () => {
      const { body: apt } = await makeApt();
      createdIds.push(apt.id);
      await request(httpServer)
        .delete(`/appointments/${apt.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});

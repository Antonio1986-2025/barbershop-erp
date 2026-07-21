import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';
import * as argon2 from 'argon2';

describe('Services (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;
  let createdIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);
  });

  afterEach(async () => {
    for (const id of createdIds) {
      await prisma.service
        .update({ where: { id }, data: { deletedAt: null, active: true } })
        .catch(() => {});
      await prisma.service.delete({ where: { id } }).catch(() => {});
    }
    createdIds = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /services', () => {
    it('deve criar serviço (201)', async () => {
      const res = await request(httpServer)
        .post('/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Corte Tesoura', durationMinutes: 60, price: 55 })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Corte Tesoura');
      expect(res.body.durationMinutes).toBe(60);
      expect(res.body.price).toBe('55');
      createdIds.push(res.body.id);
    });

    it('deve criar serviço com comissão', async () => {
      const res = await request(httpServer)
        .post('/services')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Barba Completa',
          durationMinutes: 30,
          price: 35,
          commissionType: 'PERCENTAGE',
          commissionValue: 40,
        })
        .expect(201);
      expect(res.body.commissionType).toBe('PERCENTAGE');
      createdIds.push(res.body.id);
    });

    it('deve retornar 400 para duração inválida', async () => {
      await request(httpServer)
        .post('/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invalido', durationMinutes: 0, price: 10 })
        .expect(400);
    });
  });

  describe('GET /services', () => {
    it('deve listar serviços (200)', async () => {
      const res = await request(httpServer)
        .get('/services')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('PATCH /services/:id', () => {
    it('deve atualizar serviço (200)', async () => {
      const sres = await request(httpServer)
        .post('/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Srv Original', durationMinutes: 45, price: 40 })
        .expect(201);
      createdIds.push(sres.body.id);

      const res = await request(httpServer)
        .patch(`/services/${sres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 50 })
        .expect(200);
      expect(Number(res.body.price)).toBe(50);
    });
  });

  describe('DELETE /services/:id', () => {
    it('deve remover serviço não vinculado (200)', async () => {
      const sres = await request(httpServer)
        .post('/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Del Svc', durationMinutes: 30, price: 25 })
        .expect(201);
      createdIds.push(sres.body.id);

      const res = await request(httpServer)
        .delete(`/services/${sres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.active).toBe(false);
    });
  });
});

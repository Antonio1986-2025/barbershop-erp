import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('Professionals (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;
  let companyId: string;
  let unitId: string;
  let createdIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);
    const company = await prisma.company.findFirst();
    companyId = company!.id;
    const unit = await prisma.unit.findFirst({ where: { companyId } });
    unitId =
      unit?.id ??
      (
        await prisma.unit.create({
          data: { companyId, name: 'Unidade Teste', code: `TST-${Date.now()}` },
        })
      ).id;
  });

  afterEach(async () => {
    for (const id of createdIds) {
      await prisma.professionalUnit.deleteMany({
        where: { professionalId: id },
      });
      await prisma.professional
        .update({ where: { id }, data: { deletedAt: null, active: true } })
        .catch(() => {});
      await prisma.professional.delete({ where: { id } }).catch(() => {});
    }
    createdIds = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /professionals', () => {
    it('deve criar profissional (201)', async () => {
      const res = await request(httpServer)
        .post('/professionals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'João Prof',
          email: `joaoprof${Date.now()}@test.com`,
          phone: '11933334444',
        })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('João Prof');
      createdIds.push(res.body.id);
    });

    it('deve criar profissional com vínculo de unidade', async () => {
      const res = await request(httpServer)
        .post('/professionals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Com Unidade',
          email: `uniprof${Date.now()}@test.com`,
          unitIds: [unitId],
        })
        .expect(201);
      expect(res.body.units).toBeDefined();
      expect(res.body.units.length).toBeGreaterThanOrEqual(1);
      createdIds.push(res.body.id);
    });

    it('deve retornar 400 para payload inválido', async () => {
      await request(httpServer)
        .post('/professionals')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /professionals', () => {
    it('deve listar profissionais (200)', async () => {
      const res = await request(httpServer)
        .get('/professionals')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /professionals/:id', () => {
    it('deve retornar profissional por id (200)', async () => {
      const { body: prof } = await request(httpServer)
        .post('/professionals')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Busca Prof', email: `busca${Date.now()}@test.com` })
        .expect(201);
      createdIds.push(prof.id);

      const res = await request(httpServer)
        .get(`/professionals/${prof.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.name).toBe('Busca Prof');
    });
  });

  describe('PATCH /professionals/:id', () => {
    it('deve atualizar profissional (200)', async () => {
      const { body: prof } = await request(httpServer)
        .post('/professionals')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original', email: `orig${Date.now()}@test.com` })
        .expect(201);
      createdIds.push(prof.id);

      const res = await request(httpServer)
        .patch(`/professionals/${prof.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Atualizado' })
        .expect(200);
      expect(res.body.name).toBe('Atualizado');
    });
  });

  describe('DELETE /professionals/:id', () => {
    it('deve remover profissional (200)', async () => {
      const { body: prof } = await request(httpServer)
        .post('/professionals')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Delete Prof', email: `del${Date.now()}@test.com` })
        .expect(201);
      createdIds.push(prof.id);

      await request(httpServer)
        .delete(`/professionals/${prof.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});

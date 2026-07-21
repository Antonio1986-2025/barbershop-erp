import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('Customers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;
  let companyId: string;
  let createdIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);
    const company = await prisma.company.findFirst();
    companyId = company!.id;
  });

  afterEach(async () => {
    for (const id of createdIds) {
      await prisma.customer
        .update({ where: { id }, data: { deletedAt: null, active: true } })
        .catch(() => {});
      await prisma.customer.delete({ where: { id } }).catch(() => {});
    }
    createdIds = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /customers', () => {
    it('deve criar cliente (201)', async () => {
      const res = await request(httpServer)
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Maria Cliente',
          email: `maria${Date.now()}@test.com`,
          phone: '11911112222',
        })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Maria Cliente');
      createdIds.push(res.body.id);
    });

    it('deve retornar 400 para nome ausente', async () => {
      await request(httpServer)
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'test@test.com' })
        .expect(400);
    });
  });

  describe('GET /customers', () => {
    it('deve listar clientes (200)', async () => {
      const res = await request(httpServer)
        .get('/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('deve filtrar por search', async () => {
      const res = await request(httpServer)
        .get('/customers?search=Admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      for (const c of res.body.data) {
        const match = c.name.toLowerCase().includes('admin');
        expect(match).toBe(true);
      }
    });
  });

  describe('GET /customers/:id', () => {
    it('deve retornar cliente por ID (200)', async () => {
      const cres = await request(httpServer)
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Busca Cliente', email: `busca${Date.now()}@test.com` })
        .expect(201);
      createdIds.push(cres.body.id);

      const res = await request(httpServer)
        .get(`/customers/${cres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.name).toBe('Busca Cliente');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      await request(httpServer)
        .get('/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /customers/:id', () => {
    it('deve atualizar cliente (200)', async () => {
      const cres = await request(httpServer)
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original', email: `orig${Date.now()}@test.com` })
        .expect(201);
      createdIds.push(cres.body.id);

      const res = await request(httpServer)
        .patch(`/customers/${cres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Atualizado' })
        .expect(200);
      expect(res.body.name).toBe('Atualizado');
    });
  });

  describe('DELETE /customers/:id (soft delete)', () => {
    it('deve desativar cliente (200)', async () => {
      const cres = await request(httpServer)
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Será Deletado', email: `delcust${Date.now()}@test.com` })
        .expect(201);
      createdIds.push(cres.body.id);

      const res = await request(httpServer)
        .delete(`/customers/${cres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.active).toBe(false);
      expect(res.body.deletedAt).toBeDefined();
    });
  });

  describe('RBAC', () => {
    it('deve retornar 401 sem token', async () => {
      await request(httpServer).get('/customers').expect(401);
    });
  });
});

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('Suppliers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);
  });

  afterAll(async () => {
    await prisma.purchaseItem.deleteMany().catch(() => {});
    await prisma.purchase.deleteMany().catch(() => {});
    await prisma.supplier.deleteMany().catch(() => {});
    await app.close();
  });

  describe('POST /suppliers', () => {
    it('deve criar fornecedor', async () => {
      const res = await request(httpServer)
        .post('/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Distribuidora Teste', document: '11222333444455' })
        .expect(201);

      expect(res.body.name).toBe('Distribuidora Teste');
      expect(res.body.id).toBeDefined();
    });

    it('deve retornar 400 se nome ausente', async () => {
      await request(httpServer)
        .post('/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send({ document: '11222333444455' })
        .expect(400);
    });

    it('deve retornar 401 sem token', async () => {
      await request(httpServer)
        .post('/suppliers')
        .send({ name: 'Teste' })
        .expect(401);
    });
  });

  describe('GET /suppliers', () => {
    it('deve listar fornecedores', async () => {
      const res = await request(httpServer)
        .get('/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('deve filtrar por search', async () => {
      const res = await request(httpServer)
        .get('/suppliers?search=Distribuidora')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /suppliers/:id', () => {
    it('deve retornar fornecedor por id', async () => {
      const created = await request(httpServer)
        .post('/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Busca Teste' });

      const res = await request(httpServer)
        .get(`/suppliers/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.name).toBe('Busca Teste');
    });

    it('deve retornar 404 para id inexistente', async () => {
      await request(httpServer)
        .get('/suppliers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /suppliers/:id', () => {
    it('deve atualizar fornecedor', async () => {
      const created = await request(httpServer)
        .post('/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Antigo' });

      const res = await request(httpServer)
        .patch(`/suppliers/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Novo Nome' })
        .expect(200);

      expect(res.body.name).toBe('Novo Nome');
    });
  });

  describe('DELETE /suppliers/:id', () => {
    it('deve remover fornecedor (soft delete)', async () => {
      const created = await request(httpServer)
        .post('/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Remover' });

      const res = await request(httpServer)
        .delete(`/suppliers/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.active).toBe(false);
    });
  });
});

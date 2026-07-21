import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken, loginAsUser } from '../../helpers/auth';
import * as argon2 from 'argon2';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let adminToken: string;
  let companyId: string;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    const company = await prisma.company.findFirst();
    companyId = company!.id;
    adminToken = await getAuthToken(app);
  });

  afterEach(async () => {
    for (const id of createdUserIds) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.user.update({
        where: { id },
        data: { deletedAt: null, active: true },
      }).catch(() => {});
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
    createdUserIds = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    const createPayload = {
      name: 'Novo Usuário',
      email: 'novo@test.com',
      password: '123456',
    };

    it('deve criar usuário com sucesso (201)', async () => {
      const res = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createPayload)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Novo Usuário');
      expect(res.body.email).toBe('novo@test.com');
      expect(res.body.active).toBe(true);
      createdUserIds.push(res.body.id);
    });

    it('nunca deve retornar passwordHash', async () => {
      const res = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createPayload)
        .expect(201);

      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('password');
      createdUserIds.push(res.body.id);
    });

    it('deve retornar 409 para email duplicado', async () => {
      const res = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createPayload)
        .expect(201);

      createdUserIds.push(res.body.id);

      await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createPayload)
        .expect(409);
    });

    it('deve retornar 400 para payload inválido', async () => {
      await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Sem Email' })
        .expect(400);
    });

    it('deve retornar 400 para senha curta', async () => {
      await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', email: 'test@test.com', password: '12' })
        .expect(400);
    });
  });

  describe('GET /users', () => {
    it('deve retornar lista paginada (200)', async () => {
      const res = await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('deve suportar paginação via query params', async () => {
      const res = await request(httpServer)
        .get('/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.meta.limit).toBe(5);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('deve filtrar por search (nome)', async () => {
      const res = await request(httpServer)
        .get('/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const user of res.body.data) {
        const matches =
          user.name.toLowerCase().includes('admin') ||
          user.email.toLowerCase().includes('admin');
        expect(matches).toBe(true);
      }
    });

    it('nunca deve retornar passwordHash', async () => {
      const res = await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const user of res.body.data) {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  describe('GET /users/:id', () => {
    it('deve retornar usuário por ID (200)', async () => {
      const company = await prisma.company.findFirst();
      const userInDb = await prisma.user.findFirst({
        where: { companyId: company!.id, deletedAt: null },
      });

      const res = await request(httpServer)
        .get(`/users/${userInDb!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(userInDb!.id);
      expect(res.body.name).toBe(userInDb!.name);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      await request(httpServer)
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('nunca deve retornar passwordHash', async () => {
      const company = await prisma.company.findFirst();
      const userInDb = await prisma.user.findFirst({
        where: { companyId: company!.id, deletedAt: null },
      });

      const res = await request(httpServer)
        .get(`/users/${userInDb!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('PATCH /users/:id', () => {
    it('deve atualizar usuário com sucesso (200)', async () => {
      const res = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Para Atualizar', email: `update${Date.now()}@test.com`, password: '123456' })
        .expect(201);

      createdUserIds.push(res.body.id);

      const updated = await request(httpServer)
        .patch(`/users/${res.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nome Alterado' })
        .expect(200);

      expect(updated.body.name).toBe('Nome Alterado');
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      await request(httpServer)
        .patch('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });

    it('deve retornar 409 para email duplicado', async () => {
      const res1 = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'User A', email: `a${Date.now()}@test.com`, password: '123456' })
        .expect(201);
      createdUserIds.push(res1.body.id);

      const res2 = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'User B', email: `b${Date.now()}@test.com`, password: '123456' })
        .expect(201);
      createdUserIds.push(res2.body.id);

      await request(httpServer)
        .patch(`/users/${res1.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: res2.body.email })
        .expect(409);
    });
  });

  describe('DELETE /users/:id (soft delete)', () => {
    it('deve realizar soft delete (200)', async () => {
      const res = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Será Deletado', email: `del${Date.now()}@test.com`, password: '123456' })
        .expect(201);

      createdUserIds.push(res.body.id);

      const deleted = await request(httpServer)
        .delete(`/users/${res.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleted.body.active).toBe(false);
      expect(deleted.body.deletedAt).toBeDefined();
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      await request(httpServer)
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('usuário deletado não deve aparecer na listagem', async () => {
      const res = await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Sumiu', email: `sumiu${Date.now()}@test.com`, password: '123456' })
        .expect(201);

      createdUserIds.push(res.body.id);

      await request(httpServer)
        .delete(`/users/${res.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const list = await request(httpServer)
        .get(`/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = list.body.data.find((u: any) => u.id === res.body.id);
      expect(found).toBeUndefined();
    });
  });

  describe('RBAC', () => {
    it('deve retornar 401 sem token', async () => {
      await request(httpServer).get('/users').expect(401);
    });

    it('deve retornar 401 para token inválido', async () => {
      await request(httpServer)
        .get('/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('deve retornar 403 para usuário sem permissão users.view', async () => {
      const noPermRole = await prisma.role.create({
        data: { name: 'No Perm', slug: `no-perm-${Date.now()}` },
      });

      const noPermHash = await argon2.hash('123456');
      const noPermUser = await prisma.user.create({
        data: {
          companyId,
          name: 'No Permission',
          email: `noperm${Date.now()}@test.com`,
          passwordHash: noPermHash,
          active: true,
        },
      });
      createdUserIds.push(noPermUser.id);
      await prisma.userRole.create({ data: { userId: noPermUser.id, roleId: noPermRole.id } });

      const token = await loginAsUser(app, noPermUser.email, '123456');

      await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(httpServer)
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', email: `test${Date.now()}@test.com`, password: '123456' })
        .expect(403);
    });

    it('admin deve acessar todos os endpoints (200)', async () => {
      await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});

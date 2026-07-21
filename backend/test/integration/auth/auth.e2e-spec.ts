import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken, loginAsUser } from '../../helpers/auth';
import * as argon2 from 'argon2';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('deve retornar 201 com accessToken e refreshToken', async () => {
      const res = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: '123456' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.refreshToken).toBeDefined();
      expect(typeof res.body.refreshToken).toBe('string');
    });

    it('deve retornar payload do usuário no login', async () => {
      const res = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: '123456' })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@demo.com');
      expect(res.body.user.name).toBeDefined();
      expect(res.body.user.companyId).toBeDefined();
      expect(res.body.user.companyName).toBeDefined();
      expect(Array.isArray(res.body.user.roles)).toBe(true);
      expect(Array.isArray(res.body.user.permissions)).toBe(true);
    });

    it('deve retornar JWT no accessToken', async () => {
      const res = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: '123456' })
        .expect(201);

      const tokenParts = res.body.accessToken.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('deve retornar 401 para senha inválida', async () => {
      await request(httpServer)
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: 'wrong-password' })
        .expect(401);
    });

    it('deve retornar 401 para email inexistente', async () => {
      await request(httpServer)
        .post('/auth/login')
        .send({ email: 'noexiste@test.com', password: '123456' })
        .expect(401);
    });

    it('deve retornar 400 para payload inválido (email mal formatado)', async () => {
      await request(httpServer)
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '123456' })
        .expect(400);
    });

    it('deve retornar 400 para senha curta', async () => {
      const companies = await prisma.company.findMany();
      for (const c of companies) {
        await prisma.refreshToken.deleteMany({ where: { user: { companyId: c.id } } });
      }

      await request(httpServer)
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: '12' })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('deve retornar 201 com novos tokens', async () => {
      const loginRes = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: '123456' })
        .expect(201);

      const res = await request(httpServer)
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('deve retornar 401 para refresh token inválido', async () => {
      await request(httpServer)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('deve retornar 400 para refresh token vazio', async () => {
      await request(httpServer)
        .post('/auth/refresh')
        .send({ refreshToken: '' })
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('deve retornar 200 e mensagem de sucesso', async () => {
      const token = await getAuthToken(app);

      const res = await request(httpServer)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body.message).toBe('Sessão encerrada');
    });

    it('deve retornar 401 sem token', async () => {
      await request(httpServer).post('/auth/logout').expect(401);
    });

    it('deve retornar 401 para token inválido', async () => {
      await request(httpServer)
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const token = await getAuthToken(app);

      const res = await request(httpServer)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe('admin@demo.com');
      expect(res.body.name).toBeDefined();
      expect(res.body.companyId).toBeDefined();
    });

    it('deve retornar 401 sem token', async () => {
      await request(httpServer).get('/auth/me').expect(401);
    });

    it('deve retornar 401 para token inválido', async () => {
      await request(httpServer)
        .get('/auth/me')
        .set('Authorization', 'Bearer expired-or-invalid-token')
        .expect(401);
    });
  });

  describe('RBAC', () => {
    it('admin deve acessar rota protegida por RolesGuard', async () => {
      const token = await getAuthToken(app);

      await request(httpServer)
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('deve retornar 403 para usuário sem role admin', async () => {
      const company = await prisma.company.findFirst();
      const role = await prisma.role.create({
        data: { name: 'Visualizador', slug: 'viewer' },
      });

      const hash = await argon2.hash('123456');
      const user = await prisma.user.create({
        data: {
          companyId: company!.id,
          name: 'Viewer User',
          email: `viewer${Date.now()}@test.com`,
          passwordHash: hash,
          active: true,
        },
      });
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

      const token = await loginAsUser(app, user.email, '123456');

      await request(httpServer)
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await prisma.auditLog.deleteMany({ where: { userId: user.id } });
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.role.delete({ where: { id: role.id } });
    });

    it('deve retornar 401 para JWT ausente', async () => {
      await request(httpServer).get('/auth/admin-only').expect(401);
    });
  });
});

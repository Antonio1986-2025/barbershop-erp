import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken, getAdminCredentials } from '../../helpers/auth';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;
  let companyId: string;
  let userId: string;
  let createdIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);
    const creds = await getAdminCredentials(app);
    companyId = creds.companyId;
    userId = creds.userId;
  });

  afterEach(async () => {
    for (const id of createdIds) {
      await prisma.notification.delete({ where: { id } }).catch(() => {});
    }
    createdIds = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /notifications', () => {
    it('deve criar notificação (201)', async () => {
      const res = await request(httpServer)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyId,
          type: 'APPOINTMENT_CREATED',
          title: 'Novo Agendamento',
          message: 'Cliente João agendou Corte',
        })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Novo Agendamento');
      createdIds.push(res.body.id);
    });

    it('deve criar notificação com canal (201)', async () => {
      const res = await request(httpServer)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyId,
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Confirmado',
          message: 'Agendamento confirmado',
          channel: 'INTERNAL',
        })
        .expect(201);
      expect(res.body.channel).toBe('INTERNAL');
      createdIds.push(res.body.id);
    });

    it('deve retornar 400 para tipo inválido', async () => {
      await request(httpServer)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyId,
          type: 'INVALID_TYPE',
          title: 'Teste',
          message: 'Mensagem',
        })
        .expect(400);
    });

    it('deve retornar 401 sem token', async () => {
      await request(httpServer)
        .post('/notifications')
        .send({
          companyId,
          type: 'APPOINTMENT_CREATED',
          title: 'Teste',
          message: 'Mensagem',
        })
        .expect(401);
    });
  });

  describe('GET /notifications', () => {
    it('deve listar notificações (200)', async () => {
      const res = await request(httpServer)
        .get('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('deve filtrar por status', async () => {
      const res = await request(httpServer)
        .get('/notifications?status=PENDING')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      for (const n of res.body.data) {
        expect(n.status).toBe('PENDING');
      }
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('deve retornar contagem de não lidas (200)', async () => {
      await request(httpServer)
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('GET /notifications/:id', () => {
    it('deve retornar notificação por ID (200)', async () => {
      const nres = await request(httpServer)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyId,
          type: 'APPOINTMENT_REMINDER',
          title: 'Lembrete',
          message: 'Consulta amanhã',
        })
        .expect(201);
      createdIds.push(nres.body.id);

      const res = await request(httpServer)
        .get(`/notifications/${nres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.title).toBe('Lembrete');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      await request(httpServer)
        .get('/notifications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('deve marcar notificação como lida (200)', async () => {
      const nres = await request(httpServer)
        .post('/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyId,
          type: 'APPOINTMENT_CREATED',
          title: 'Ler',
          message: 'Marcar como lida',
        })
        .expect(201);
      createdIds.push(nres.body.id);

      const res = await request(httpServer)
        .patch(`/notifications/${nres.body.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.status).toBe('READ');
    });
  });
});

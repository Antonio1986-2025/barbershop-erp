import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { getAuthToken } from '../../helpers/auth';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const dateParams = 'startDate=2026-01-01&endDate=2026-12-31';

  describe('GET /dashboard/summary', () => {
    it('deve retornar resumo (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/summary?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('revenue');
      expect(res.body).toHaveProperty('appointments');
      expect(res.body).toHaveProperty('completedServices');
      expect(res.body).toHaveProperty('customers');
      expect(res.body).toHaveProperty('averageTicket');
    });
  });

  describe('GET /dashboard/financial', () => {
    it('deve retornar dados financeiros (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/financial?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('payments');
      expect(res.body).toHaveProperty('entries');
      expect(res.body).toHaveProperty('exits');
      expect(res.body).toHaveProperty('balance');
    });
  });

  describe('GET /dashboard/operations', () => {
    it('deve retornar operações (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/operations?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('appointments');
      expect(res.body).toHaveProperty('serviceOrders');
    });
  });

  describe('GET /dashboard/professionals', () => {
    it('deve retornar desempenho de profissionais (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/professionals?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /dashboard/services', () => {
    it('deve retornar serviços mais realizados (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/services?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /dashboard/stock', () => {
    it('deve retornar situação do estoque (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/stock?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('totalProducts');
      expect(res.body).toHaveProperty('totalQuantity');
      expect(res.body).toHaveProperty('criticalProducts');
    });
  });

  describe('GET /dashboard/overview', () => {
    it('deve retornar overview (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/overview?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('revenueTotal');
      expect(res.body).toHaveProperty('appointmentsTotal');
    });
  });

  describe('GET /dashboard/revenue-chart', () => {
    it('deve retornar gráfico de receita (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/revenue-chart?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /dashboard/top-services', () => {
    it('deve retornar top serviços (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/top-services?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /dashboard/professionals-ranking', () => {
    it('deve retornar ranking de profissionais (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/professionals-ranking?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /dashboard/occupancy', () => {
    it('deve retornar taxa de ocupação (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/occupancy?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('occupancyPercentage');
    });
  });

  describe('GET /dashboard/financial-analysis', () => {
    it('deve retornar análise financeira (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/financial-analysis?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('revenue');
      expect(res.body).toHaveProperty('expenses');
      expect(res.body).toHaveProperty('profit');
    });
  });

  describe('GET /dashboard/stock-analysis', () => {
    it('deve retornar análise de estoque (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/stock-analysis?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('totalProducts');
      expect(res.body).toHaveProperty('stockValue');
    });
  });

  describe('GET /dashboard/alerts', () => {
    it('deve retornar alertas (200)', async () => {
      const res = await request(httpServer)
        .get(`/dashboard/alerts?${dateParams}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('RBAC', () => {
    it('deve retornar 401 sem token', async () => {
      await request(httpServer).get('/dashboard/summary').expect(401);
    });
  });
});

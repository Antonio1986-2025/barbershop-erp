import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('StockReports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;

  let companyId: string;
  let unitId: string;
  let productId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);

    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found. Run seed first.');
    companyId = company.id;

    const unit = await prisma.unit.create({
      data: { companyId, name: 'Unidade Reports', code: 'RPT-E2E', createdBy: 'test-e2e' },
    });
    unitId = unit.id;

    const product = await prisma.product.create({
      data: { companyId, name: 'Produto Report', salePrice: 100, costPrice: 40, createdBy: 'test-e2e' },
    });
    productId = product.id;

    await prisma.stock.create({
      data: { companyId, unitId, productId, quantity: 80, avgCost: 25, createdBy: 'test-e2e' },
    });

    await prisma.stockMovement.create({
      data: {
        companyId, unitId, productId,
        type: 'PURCHASE', quantity: 80,
        unitCost: 25, totalCost: 2000,
        balanceBefore: 0, balanceAfter: 80,
        avgCostBefore: 0, avgCostAfter: 25,
        createdBy: 'test-e2e',
        description: 'Compra inicial',
      },
    });
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany().catch(() => {});
    await prisma.stock.deleteMany().catch(() => {});
    await prisma.product.deleteMany({ where: { createdBy: 'test-e2e' } }).catch(() => {});
    await prisma.unit.deleteMany({ where: { createdBy: 'test-e2e' } }).catch(() => {});
    await app.close();
  });

  describe('GET /stock/reports/current-stock', () => {
    it('deve retornar posicao atual', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/current-stock')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(Number(res.body[0].quantity)).toBe(80);
    });

    it('deve filtrar por unitId', async () => {
      const res = await request(httpServer)
        .get(`/stock/reports/current-stock?unitId=${unitId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.every((r: any) => r.unitId === unitId)).toBe(true);
    });

    it('deve retornar 401 sem token', async () => {
      await request(httpServer)
        .get('/stock/reports/current-stock')
        .expect(401);
    });
  });

  describe('GET /stock/reports/movements', () => {
    it('deve retornar movimentacoes paginadas', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/movements')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('deve filtrar por tipo', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/movements?type=PURCHASE')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((m: any) => m.type === 'PURCHASE')).toBe(true);
    });
  });

  describe('GET /stock/reports/kardex/:productId', () => {
    it('deve retornar kardex do produto', async () => {
      const res = await request(httpServer)
        .get(`/stock/reports/kardex/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve retornar 404 para produto inexistente', async () => {
      await request(httpServer)
        .get('/stock/reports/kardex/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('GET /stock/reports/turnover', () => {
    it('deve retornar giro de estoque', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/turnover')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /stock/reports/valuation', () => {
    it('deve retornar valorizacao', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/valuation')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /stock/reports/low-stock', () => {
    it('deve retornar produtos com estoque baixo', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/low-stock')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /stock/reports/inactive-products', () => {
    it('deve retornar produtos sem movimentacao', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/inactive-products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Export CSV', () => {
    it('deve exportar current-stock como CSV', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/current-stock?format=csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('.csv');
    });

    it('deve exportar movements como CSV', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/movements?format=csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Export Excel', () => {
    it('deve exportar current-stock como XLSX', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/current-stock?format=xlsx')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('spreadsheetml');
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });
  });

  describe('Export PDF', () => {
    it('deve exportar current-stock como PDF', async () => {
      const res = await request(httpServer)
        .get('/stock/reports/current-stock?format=pdf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('pdf');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });
  });
});

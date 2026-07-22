import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('StockMovements (e2e)', () => {
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

    let unit = await prisma.unit.findFirst({ where: { companyId } });
    if (!unit) {
      unit = await prisma.unit.create({
        data: { companyId, name: 'Unidade Teste Stock', code: 'STOCK-E2E', createdBy: 'test' },
      });
    }
    unitId = unit.id;

    const product = await prisma.product.create({
      data: {
        companyId, name: 'Produto E2E Stock', salePrice: 100, costPrice: 40, createdBy: 'test-e2e',
      },
    });
    productId = product.id;

    await prisma.stockMovement.deleteMany({ where: { productId } }).catch(() => {});
    await prisma.stock.deleteMany({ where: { productId } }).catch(() => {});
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { productId } }).catch(() => {});
    await prisma.stock.deleteMany({ where: { productId } }).catch(() => {});
    await prisma.product.deleteMany({ where: { createdBy: 'test-e2e' } }).catch(() => {});
    await prisma.unit.deleteMany({ where: { createdBy: 'test' } }).catch(() => {});
    await app.close();
  });

  describe('GET /stock/products/:productId/stock', () => {
    it('deve retornar estoque zerado para produto sem movimentacao', async () => {
      const res = await request(httpServer)
        .get(`/stock/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.product.id).toBe(productId);
      expect(res.body.totalQuantity).toBe(0);
    });

    it('deve retornar 404 para produto inexistente', async () => {
      await request(httpServer)
        .get('/stock/products/00000000-0000-0000-0000-000000000000/stock')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /stock/adjust', () => {
    it('deve criar ajuste positivo e atualizar saldo', async () => {
      const res = await request(httpServer)
        .post('/stock/adjust')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId, productId, quantity: 10, unitCost: 15 })
        .expect(201);

      expect(res.body.type).toBe('ADJUSTMENT');
      expect(Number(res.body.balanceAfter)).toBe(10);
      expect(res.body.productId).toBe(productId);
    });

    it('deve criar ajuste negativo e reduzir saldo', async () => {
      const res = await request(httpServer)
        .post('/stock/adjust')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId, productId, quantity: -3 })
        .expect(201);

      expect(res.body.type).toBe('ADJUSTMENT');
      expect(Number(res.body.balanceAfter)).toBe(7);
    });

    it('deve rejeitar ajuste com quantidade zero', async () => {
      await request(httpServer)
        .post('/stock/adjust')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId, productId, quantity: 0 })
        .expect(400);
    });

    it('deve rejeitar estoque negativo', async () => {
      await request(httpServer)
        .post('/stock/adjust')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId, productId, quantity: -999 })
        .expect(400);
    });
  });

  describe('GET /stock/movements', () => {
    it('deve listar movimentacoes do produto', async () => {
      const res = await request(httpServer)
        .get(`/stock/movements?productId=${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((m: any) => m.productId === productId)).toBe(true);
    });
  });

  describe('GET /stock/movements/:id', () => {
    it('deve retornar movimentacao por id', async () => {
      const movements = await request(httpServer)
        .get(`/stock/movements?productId=${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(movements.body.data.length).toBeGreaterThan(0);
      const id = movements.body.data[0].id;
      const res = await request(httpServer)
        .get(`/stock/movements/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(id);
    });
  });

  describe('GET /stock/products/:productId/stock apos movimentacoes', () => {
    it('deve refletir o saldo atual', async () => {
      const res = await request(httpServer)
        .get(`/stock/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.totalQuantity).toBe(7);
      expect(res.body.stocks.length).toBe(1);
      expect(Number(res.body.stocks[0].quantity)).toBe(7);
    });
  });
});

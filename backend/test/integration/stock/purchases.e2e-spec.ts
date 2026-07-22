import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('Purchases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;

  let companyId: string;
  let supplierId: string;
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
        data: { companyId, name: 'Unidade Teste', code: 'TEST-UNIT', createdBy: 'test' },
      });
    }
    unitId = unit.id;

    let product = await prisma.product.findFirst({ where: { companyId } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          companyId, name: 'Produto Teste', salePrice: 50, costPrice: 20, createdBy: 'test',
        },
      });
    }
    productId = product.id;

    const supplier = await prisma.supplier.create({
      data: { companyId, name: 'Fornecedor Teste', createdBy: 'test' },
    });
    supplierId = supplier.id;
  });

  afterAll(async () => {
    await prisma.purchaseItem.deleteMany().catch(() => {});
    await prisma.purchase.deleteMany().catch(() => {});
    await prisma.supplier.deleteMany({ where: { createdBy: 'test' } }).catch(() => {});
    await prisma.product.deleteMany({ where: { createdBy: 'test' } }).catch(() => {});
    await prisma.unit.deleteMany({ where: { createdBy: 'test' } }).catch(() => {});
    await app.close();
  });

  describe('POST /purchases', () => {
    it('deve criar compra com itens', async () => {
      const res = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          supplierId,
          unitId,
          items: [{ productId, quantity: 10, unitCost: 15.5 }],
        })
        .expect(201);

      expect(res.body.status).toBe('DRAFT');
      expect(res.body.items).toHaveLength(1);
      expect(Number(res.body.totalAmount)).toBe(155);
    });

    it('deve retornar 400 se sem itens', async () => {
      await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [] })
        .expect(400);
    });
  });

  describe('GET /purchases', () => {
    it('deve listar compras', async () => {
      const res = await request(httpServer)
        .get('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('GET /purchases/:id', () => {
    it('deve retornar compra por id', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      const res = await request(httpServer)
        .get(`/purchases/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });
  });

  describe('POST /purchases/:id/confirm', () => {
    it('deve confirmar compra em draft', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 5, unitCost: 20 }] })
        .expect(201);

      const res = await request(httpServer)
        .post(`/purchases/${created.body.id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body.status).toBe('CONFIRMED');
    });

    it('deve criar movimentacao de estoque ao confirmar compra', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 3, unitCost: 10 }] })
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const stockRes = await request(httpServer)
        .get(`/stock/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(stockRes.body.totalQuantity).toBeGreaterThanOrEqual(3);
      const movements = await request(httpServer)
        .get(`/stock/movements?productId=${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const purchaseMovements = movements.body.data.filter(
        (m: any) => m.type === 'PURCHASE' && m.referenceId === created.body.id,
      );
      expect(purchaseMovements.length).toBe(1);
      expect(Number(purchaseMovements[0].quantity)).toBe(3);
    });

    it('deve retornar 400 se ja confirmada', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('deve retornar 400 se cancelada', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('POST /purchases/:id/cancel', () => {
    it('deve cancelar compra em draft', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      const res = await request(httpServer)
        .post(`/purchases/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body.status).toBe('CANCELLED');
    });
  });

  describe('POST /purchases/:id/items', () => {
    it('deve adicionar item em compra draft', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      const res = await request(httpServer)
        .post(`/purchases/${created.body.id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 3, unitCost: 12 })
        .expect(201);

      expect(res.body.productId).toBe(productId);
    });

    it('deve retornar 400 se compra confirmada', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 3, unitCost: 12 })
        .expect(400);
    });
  });

  describe('DELETE /purchases/:id/items/:itemId', () => {
    it('deve remover item de compra draft', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      const itemId = created.body.items[0].id;

      const res = await request(httpServer)
        .delete(`/purchases/${created.body.id}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.message).toBe('Item removido');
    });

    it('deve retornar 400 se compra confirmada', async () => {
      const created = await request(httpServer)
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({ supplierId, unitId, items: [{ productId, quantity: 1, unitCost: 10 }] })
        .expect(201);

      await request(httpServer)
        .post(`/purchases/${created.body.id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(httpServer)
        .delete(`/purchases/${created.body.id}/items/${created.body.items[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});

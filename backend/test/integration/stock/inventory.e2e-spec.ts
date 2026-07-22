import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('Inventory (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;

  let companyId: string;

  async function createUnit(name: string, code: string) {
    return prisma.unit.create({
      data: { companyId, name, code, createdBy: 'test-e2e' },
    });
  }

  async function createProduct(name: string) {
    return prisma.product.create({
      data: { companyId, name, salePrice: 80, costPrice: 30, createdBy: 'test-e2e' },
    });
  }

  async function createStock(unitId: string, productId: string, quantity: number, avgCost: number) {
    return prisma.stock.create({
      data: { companyId, unitId, productId, quantity, avgCost, createdBy: 'test-e2e' },
    });
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);

    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found. Run seed first.');
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.inventoryItem.deleteMany().catch(() => {});
    await prisma.inventoryCount.deleteMany().catch(() => {});
    await prisma.stockMovement.deleteMany().catch(() => {});
    await prisma.stock.deleteMany().catch(() => {});
    await prisma.product.deleteMany({ where: { createdBy: 'test-e2e' } }).catch(() => {});
    await prisma.unit.deleteMany({ where: { createdBy: 'test-e2e' } }).catch(() => {});
    await app.close();
  });

  describe('POST /stock/inventory', () => {
    let unitId: string;
    let productId: string;

    beforeAll(async () => {
      const unit = await createUnit('Inv-Create', 'INV-CR');
      unitId = unit.id;
      const product = await createProduct('Prod Inv Create');
      productId = product.id;
      await createStock(unitId, productId, 50, 25);
    });

    it('deve criar inventario com snapshot', async () => {
      const res = await request(httpServer)
        .post('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId })
        .expect(201);

      expect(res.body.status).toBe('OPEN');
      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(Number(res.body.items[0].systemQuantity)).toBe(50);
    });

    it('deve rejeitar segundo inventario aberto', async () => {
      await request(httpServer)
        .post('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId })
        .expect(400);
    });
  });

  describe('GET /stock/inventory', () => {
    let unitId: string;

    beforeAll(async () => {
      const unit = await createUnit('Inv-List', 'INV-LS');
      unitId = unit.id;
    });

    it('deve listar inventarios', async () => {
      await request(httpServer)
        .post('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId })
        .expect(201);

      const res = await request(httpServer)
        .get('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('GET /stock/inventory/:id', () => {
    let unitId: string;
    let inventoryId: string;

    beforeAll(async () => {
      const unit = await createUnit('Inv-Get', 'INV-GT');
      unitId = unit.id;
      const product = await createProduct('Prod Inv Get');
      await createStock(unitId, product.id, 30, 20);

      const res = await request(httpServer)
        .post('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId })
        .expect(201);
      inventoryId = res.body.id;
    });

    it('deve retornar inventario por id', async () => {
      const res = await request(httpServer)
        .get(`/stock/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(inventoryId);
      expect(res.body.items).toBeDefined();
    });
  });

  describe('Fluxo completo OPEN → COUNTING → REVIEW → CLOSED', () => {
    let unitId: string;
    let productId: string;
    let inventoryId: string;
    let itemId: string;

    beforeAll(async () => {
      const unit = await createUnit('Inv-Fluxo', 'INV-FL');
      unitId = unit.id;
      const product = await createProduct('Prod Inv Fluxo');
      productId = product.id;
      await createStock(unitId, productId, 50, 25);

      const res = await request(httpServer)
        .post('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId })
        .expect(201);
      inventoryId = res.body.id;
      itemId = res.body.items[0].id;
    });

    it('deve iniciar contagem', async () => {
      const res = await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('COUNTING');
    });

    it('deve atualizar item durante contagem (divergencia positiva)', async () => {
      const res = await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ countedQuantity: 55 })
        .expect(200);

      expect(Number(res.body.difference)).toBe(5);
    });

    it('deve atualizar item durante contagem (divergencia negativa)', async () => {
      const res = await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ countedQuantity: 45 })
        .expect(200);

      expect(Number(res.body.difference)).toBe(-5);
    });

    it('deve revisar', async () => {
      const res = await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('REVIEW');
    });

    it('deve aprovar, gerar ajustes e fechar', async () => {
      const res = await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('CLOSED');
    });

    it('deve ter gerado movimentacoes de ajuste', async () => {
      const movements = await request(httpServer)
        .get(`/stock/movements?referenceId=${inventoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(movements.body.data.length).toBeGreaterThanOrEqual(1);
      expect(movements.body.data.every((m: any) => m.type === 'ADJUSTMENT')).toBe(true);
    });

    it('deve ter atualizado o saldo', async () => {
      const stockRes = await request(httpServer)
        .get(`/stock/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const unitStock = stockRes.body.stocks.find((s: any) => s.unitId === unitId);
      expect(Number(unitStock?.quantity ?? 0)).toBe(45);
    });

    it('nao deve permitir alteracao apos fechamento', async () => {
      await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('Fluxo de cancelamento', () => {
    let unitId: string;

    beforeAll(async () => {
      const unit = await createUnit('Inv-Cancel', 'INV-CL');
      unitId = unit.id;
      const product = await createProduct('Prod Inv Cancel');
      await createStock(unitId, product.id, 10, 15);
    });

    it('deve cancelar inventario aberto', async () => {
      const created = await request(httpServer)
        .post('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId })
        .expect(201);

      const res = await request(httpServer)
        .patch(`/stock/inventory/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
    });
  });

  describe('Divergencia negativa', () => {
    let unitId: string;
    let productId: string;
    let inventoryId: string;

    beforeAll(async () => {
      const unit = await createUnit('Inv-Neg', 'INV-NG');
      unitId = unit.id;
      const product = await createProduct('Prod Inv Neg');
      productId = product.id;
      await createStock(unitId, productId, 100, 10);

      const res = await request(httpServer)
        .post('/stock/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId })
        .expect(201);
      inventoryId = res.body.id;
      const itemId = res.body.items[0].id;

      await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ countedQuantity: 80 })
        .expect(200);

      await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/review`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(httpServer)
        .patch(`/stock/inventory/${inventoryId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('deve ter saldo reduzido apos divergencia negativa', async () => {
      const stockRes = await request(httpServer)
        .get(`/stock/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const unitStock = stockRes.body.stocks.find((s: any) => s.unitId === unitId);
      expect(Number(unitStock?.quantity ?? 0)).toBe(80);
    });
  });
});

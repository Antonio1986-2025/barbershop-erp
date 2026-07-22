import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken } from '../../helpers/auth';

describe('Transfers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;

  let companyId: string;
  let unitId1: string;
  let unitId2: string;
  let productId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
    token = await getAuthToken(app);

    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found. Run seed first.');
    companyId = company.id;

    const unit1 = await prisma.unit.create({
      data: { companyId, name: 'Unidade Origem', code: 'ORIG-E2E', createdBy: 'test-e2e' },
    });
    unitId1 = unit1.id;

    const unit2 = await prisma.unit.create({
      data: { companyId, name: 'Unidade Destino', code: 'DEST-E2E', createdBy: 'test-e2e' },
    });
    unitId2 = unit2.id;

    const product = await prisma.product.create({
      data: { companyId, name: 'Produto Transfer', salePrice: 100, costPrice: 40, createdBy: 'test-e2e' },
    });
    productId = product.id;

    await prisma.stock.create({
      data: {
        companyId, unitId: unitId1, productId,
        quantity: 100, avgCost: 20, createdBy: 'test-e2e',
      },
    });
  });

  afterAll(async () => {
    await prisma.transfer.deleteMany().catch(() => {});
    await prisma.stockMovement.deleteMany().catch(() => {});
    await prisma.stock.deleteMany().catch(() => {});
    await prisma.product.deleteMany({ where: { createdBy: 'test-e2e' } }).catch(() => {});
    await prisma.unit.deleteMany({ where: { createdBy: 'test-e2e' } }).catch(() => {});
    await app.close();
  });

  describe('POST /stock/transfers', () => {
    it('deve criar transferencia', async () => {
      const res = await request(httpServer)
        .post('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromUnitId: unitId1, toUnitId: unitId2, productId, quantity: 10 })
        .expect(201);

      expect(res.body.status).toBe('PENDING');
      expect(Number(res.body.unitCost)).toBe(20);
    });

    it('deve rejeitar mesma unidade', async () => {
      await request(httpServer)
        .post('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromUnitId: unitId1, toUnitId: unitId1, productId, quantity: 5 })
        .expect(400);
    });

    it('deve rejeitar saldo insuficiente', async () => {
      await request(httpServer)
        .post('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromUnitId: unitId1, toUnitId: unitId2, productId, quantity: 9999 })
        .expect(400);
    });
  });

  describe('GET /stock/transfers', () => {
    it('deve listar transferencias', async () => {
      const res = await request(httpServer)
        .get('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('deve filtrar por status', async () => {
      const res = await request(httpServer)
        .get('/stock/transfers?status=PENDING')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.every((t: any) => t.status === 'PENDING')).toBe(true);
    });
  });

  describe('GET /stock/transfers/:id', () => {
    it('deve retornar transferencia por id', async () => {
      const created = await request(httpServer)
        .post('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromUnitId: unitId1, toUnitId: unitId2, productId, quantity: 3 })
        .expect(201);

      const res = await request(httpServer)
        .get(`/stock/transfers/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });
  });

  describe('Fluxo completo PENDING → APPROVED → IN_TRANSIT → RECEIVED', () => {
    let transferId: string;

    beforeAll(async () => {
      const res = await request(httpServer)
        .post('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromUnitId: unitId1, toUnitId: unitId2, productId, quantity: 5 })
        .expect(201);
      transferId = res.body.id;
    });

    it('deve aprovar', async () => {
      const res = await request(httpServer)
        .patch(`/stock/transfers/${transferId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('APPROVED');
    });

    it('deve enviar', async () => {
      const res = await request(httpServer)
        .patch(`/stock/transfers/${transferId}/send`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('IN_TRANSIT');
    });

    it('deve receber e criar movimentacoes', async () => {
      const res = await request(httpServer)
        .patch(`/stock/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('RECEIVED');
      expect(res.body.receivedBy).toBeDefined();
    });

    it('deve atualizar saldos apos recebimento', async () => {
      const origemRes = await request(httpServer)
        .get(`/stock/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const origem = origemRes.body.stocks.find(
        (s: any) => s.unitId === unitId1,
      );
      const destino = origemRes.body.stocks.find(
        (s: any) => s.unitId === unitId2,
      );

      expect(Number(origem?.quantity ?? 0)).toBe(95);
      expect(Number(destino?.quantity ?? 0)).toBe(5);
      expect(Number(destino?.avgCost ?? 0)).toBe(20);
    });

    it('deve ter registrado movimentacoes', async () => {
      const movements = await request(httpServer)
        .get(`/stock/movements?referenceId=${transferId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const types = movements.body.data.map((m: any) => m.type).sort();
      expect(types).toEqual(['TRANSFER_IN', 'TRANSFER_OUT']);
    });
  });

  describe('Fluxo de cancelamento', () => {
    it('deve cancelar transferencia pendente', async () => {
      const created = await request(httpServer)
        .post('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromUnitId: unitId1, toUnitId: unitId2, productId, quantity: 2 })
        .expect(201);

      const res = await request(httpServer)
        .patch(`/stock/transfers/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
    });

    it('nao deve permitir transicao invalida apos cancelamento', async () => {
      const created = await request(httpServer)
        .post('/stock/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromUnitId: unitId1, toUnitId: unitId2, productId, quantity: 1 })
        .expect(201);

      await request(httpServer)
        .patch(`/stock/transfers/${created.body.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(httpServer)
        .patch(`/stock/transfers/${created.body.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});

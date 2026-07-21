import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { getAuthToken, getAdminCredentials } from '../../helpers/auth';

describe('Financial (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;
  let token: string;
  let companyId: string;
  let userId: string;
  let createdCategoryIds: string[] = [];
  let createdAccountIds: string[] = [];
  let createdRegisterIds: string[] = [];

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
    for (const id of createdAccountIds) {
      await prisma.financialAccount.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdCategoryIds) {
      await prisma.financialCategory.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdRegisterIds) {
      await prisma.cashRegister.delete({ where: { id } }).catch(() => {});
    }
    createdAccountIds = [];
    createdCategoryIds = [];
    createdRegisterIds = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /financial/categories', () => {
    it('deve criar categoria (201)', async () => {
      const res = await request(httpServer)
        .post('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Aluguel', type: 'EXPENSE' })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Aluguel');
      createdCategoryIds.push(res.body.id);
    });

    it('deve retornar 400 para tipo inválido', async () => {
      await request(httpServer)
        .post('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invalido', type: 'INVALID' })
        .expect(400);
    });

    it('deve retornar 401 sem token', async () => {
      await request(httpServer)
        .post('/financial/categories')
        .send({ name: 'Teste', type: 'INCOME' })
        .expect(401);
    });
  });

  describe('GET /financial/categories', () => {
    it('deve listar categorias (200)', async () => {
      const res = await request(httpServer)
        .get('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PATCH /financial/categories/:id', () => {
    it('deve atualizar categoria (200)', async () => {
      const cres = await request(httpServer)
        .post('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original', type: 'INCOME' })
        .expect(201);
      createdCategoryIds.push(cres.body.id);

      const res = await request(httpServer)
        .patch(`/financial/categories/${cres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Serviços' })
        .expect(200);
      expect(res.body.name).toBe('Serviços');
    });
  });

  describe('DELETE /financial/categories/:id', () => {
    it('deve remover categoria sem vínculo (200)', async () => {
      const cres = await request(httpServer)
        .post('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Remover', type: 'EXPENSE' })
        .expect(201);
      createdCategoryIds.push(cres.body.id);

      await request(httpServer)
        .delete(`/financial/categories/${cres.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('POST /financial/accounts', () => {
    let categoryId: string;

    beforeEach(async () => {
      const cres = await request(httpServer)
        .post('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Contas', type: 'EXPENSE' })
        .expect(201);
      categoryId = cres.body.id;
      createdCategoryIds.push(categoryId);
    });

    it('deve criar conta a pagar (201)', async () => {
      const res = await request(httpServer)
        .post('/financial/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          categoryId,
          description: 'Conta de Luz',
          type: 'PAYABLE',
          amount: 250,
          dueDate: '2026-06-15',
        })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.description).toBe('Conta de Luz');
      createdAccountIds.push(res.body.id);
    });

    it('deve criar conta a receber (201)', async () => {
      const res = await request(httpServer)
        .post('/financial/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          categoryId,
          description: 'Serviço Prestado',
          type: 'RECEIVABLE',
          amount: 500,
          dueDate: '2026-07-01',
        })
        .expect(201);
      expect(res.body.type).toBe('RECEIVABLE');
      createdAccountIds.push(res.body.id);
    });

    it('deve retornar 400 para dados inválidos', async () => {
      await request(httpServer)
        .post('/financial/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Sem tipo' })
        .expect(400);
    });
  });

  describe('GET /financial/accounts', () => {
    it('deve listar contas (200)', async () => {
      const res = await request(httpServer)
        .get('/financial/accounts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('PATCH /financial/accounts/:id/pay', () => {
    let categoryId: string;

    beforeEach(async () => {
      const cres = await request(httpServer)
        .post('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pgto', type: 'EXPENSE' })
        .expect(201);
      categoryId = cres.body.id;
      createdCategoryIds.push(categoryId);
    });

    it('deve marcar conta como paga (200)', async () => {
      const ares = await request(httpServer)
        .post('/financial/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          categoryId,
          description: 'Pagar',
          type: 'PAYABLE',
          amount: 100,
          dueDate: '2026-06-30',
        })
        .expect(201);
      createdAccountIds.push(ares.body.id);

      const res = await request(httpServer)
        .patch(`/financial/accounts/${ares.body.id}/pay`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.status).toBe('PAID');
    });
  });

  describe('PATCH /financial/accounts/:id/cancel', () => {
    let categoryId: string;

    beforeEach(async () => {
      const cres = await request(httpServer)
        .post('/financial/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cancel', type: 'EXPENSE' })
        .expect(201);
      categoryId = cres.body.id;
      createdCategoryIds.push(categoryId);
    });

    it('deve cancelar conta (200)', async () => {
      const ares = await request(httpServer)
        .post('/financial/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          categoryId,
          description: 'Cancelar',
          type: 'PAYABLE',
          amount: 100,
          dueDate: '2026-06-30',
        })
        .expect(201);
      createdAccountIds.push(ares.body.id);

      const res = await request(httpServer)
        .patch(`/financial/accounts/${ares.body.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.status).toBe('CANCELLED');
    });
  });

  describe('GET /financial/cash-flow', () => {
    it('deve retornar fluxo de caixa (200)', async () => {
      const res = await request(httpServer)
        .get('/financial/cash-flow')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('period');
      expect(res.body).toHaveProperty('income');
      expect(res.body).toHaveProperty('expense');
      expect(res.body).toHaveProperty('balance');
      expect(res.body).toHaveProperty('cashFlow');
    });
  });

  describe('POST /financial/cash-closing', () => {
    it('deve criar fechamento de caixa (201)', async () => {
      let unit = await prisma.unit.findFirst({ where: { companyId } });
      if (!unit) {
        unit = await prisma.unit.create({
          data: { companyId, name: 'Matriz', code: 'MAT', address: 'Rua A', phone: '11999999999' },
        });
      }
      const reg = await prisma.cashRegister.create({
        data: {
          companyId,
          unitId: unit.id,
          openedBy: userId,
          openingAmount: 500,
          openedAt: new Date(),
          status: 'OPEN',
        },
      });
      createdRegisterIds.push(reg.id);

      const res = await request(httpServer)
        .post('/financial/cash-closing')
        .set('Authorization', `Bearer ${token}`)
        .send({ cashRegisterId: reg.id, closingAmount: 650 })
        .expect(201);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('GET /financial/cash-closing', () => {
    it('deve listar fechamentos (200)', async () => {
      const res = await request(httpServer)
        .get('/financial/cash-closing')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

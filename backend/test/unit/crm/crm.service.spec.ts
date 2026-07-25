import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from '../../../src/modules/crm/crm.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CrmService', () => {
  let service: CrmService;
  let prisma: any;

  const mockCustomer = {
    id: 'cust-1',
    companyId: 'company-1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '11999999999',
    birthDate: new Date('1990-05-15'),
    active: true,
  };

  const mockPaidSales = [
    {
      id: 'sale-1',
      total: 150,
      discountAmount: 0,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      items: [{ productId: 'prod-1', serviceName: null }],
    },
    {
      id: 'sale-2',
      total: 300,
      discountAmount: 10,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      items: [{ productId: null, serviceName: 'Corte' }],
    },
  ];

  const mockAppointments = [
    { id: 'apt-1', startAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'COMPLETED', service: { name: 'Corte' } },
    { id: 'apt-2', startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'SCHEDULED', service: { name: 'Barba' } },
  ];

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn().mockResolvedValue(mockCustomer),
      },
      sale: {
        findMany: jest.fn().mockResolvedValue(mockPaidSales),
      },
      appointment: {
        findMany: jest.fn().mockResolvedValue(mockAppointments),
      },
      loyaltyPoints: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { points: 500 } }),
      },
      cashbackTransaction: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 25 } }),
      },
      customerTagAssignment: {
        findMany: jest.fn().mockResolvedValue([
          { tag: { id: 'tag-1', name: 'VIP', color: '#gold' } },
        ]),
      },
      customerSegment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((d) => Promise.resolve({ id: 'seg-1', ...d.data })),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('deve retornar perfil 360 do cliente', async () => {
      const result = await service.getProfile('company-1', 'cust-1');
      expect(result.customer.id).toBe('cust-1');
      expect(result.finance.totalSpent).toBe(450);
      expect(result.finance.totalPurchases).toBe(2);
      expect(result.finance.averageTicket).toBe(225);
      expect(result.finance.highestPurchase).toBe(300);
      expect(result.finance.totalProducts).toBe(1);
      expect(result.finance.totalServices).toBe(1);
      expect(result.appointments.total).toBe(2);
      expect(result.appointments.completed).toBe(1);
      expect(result.loyalty.points).toBe(500);
      expect(result.loyalty.cashbackBalance).toBe(25);
      expect(result.relationship.tags).toHaveLength(1);
      expect(result.relationship.score).toBeGreaterThanOrEqual(0);
      expect(result.relationship.score).toBeLessThanOrEqual(100);
    });

    it('deve lancar NotFoundException para cliente inexistente', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.getProfile('company-1', 'not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('segment CRUD', () => {
    it('deve criar segmento', async () => {
      const dto = {
        name: 'VIP',
        description: 'Clientes premium',
        rules: [{ field: 'totalSpent', operator: 'gte', value: 1000 }],
        color: '#gold',
      };
      const result = await service.createSegment('company-1', dto as any);
      expect(result.name).toBe('VIP');
      expect(prisma.customerSegment.create).toHaveBeenCalled();
    });

    it('deve retornar NotFound ao buscar segmento inexistente', async () => {
      prisma.customerSegment.findFirst.mockResolvedValue(null);
      await expect(service.findSegment('company-1', 'not-found')).rejects.toThrow(NotFoundException);
    });

    it('deve deletar segmento (soft delete)', async () => {
      prisma.customerSegment.findFirst.mockResolvedValue({ id: 'seg-1', companyId: 'company-1' });
      await service.deleteSegment('company-1', 'seg-1');
      expect(prisma.customerSegment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'seg-1' }, data: { active: false } }),
      );
    });
  });

  describe('CustomerScore', () => {
    it('deve calcular score 100 para cliente perfeito', () => {
      const score = (service as any).computeScore({
        totalPurchases: 50,
        totalSpent: 50000,
        averageTicket: 1000,
        highestPurchase: 5000,
        daysSinceLastPurchase: 1,
        totalAppointments: 20,
        cancellationRate: 0,
        loyaltyPoints: 5000,
        cashbackBalance: 1000,
      });
      expect(score).toBe(100);
    });

    it('deve calcular score minimo para cliente sem dados', () => {
      const score = (service as any).computeScore({
        totalPurchases: 0,
        totalSpent: 0,
        averageTicket: 0,
        highestPurchase: 0,
        daysSinceLastPurchase: null,
        totalAppointments: 0,
        cancellationRate: 0,
        loyaltyPoints: 0,
        cashbackBalance: 0,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(20);
    });

    it('deve penalizar cliente com alta taxa de cancelamento', () => {
      const score = (service as any).computeScore({
        totalPurchases: 5,
        totalSpent: 500,
        averageTicket: 100,
        highestPurchase: 200,
        daysSinceLastPurchase: 365,
        totalAppointments: 10,
        cancellationRate: 0.5,
        loyaltyPoints: 50,
        cashbackBalance: 10,
      });
      expect(score).toBeLessThan(50);
    });
  });

  describe('computeCustomerSegments', () => {
    it('deve retornar segmentos vazios se nenhuma regra bater', async () => {
      prisma.customerSegment.findMany.mockResolvedValue([
        { id: 's1', name: 'Alto Gasto', rules: JSON.stringify([{ field: 'totalSpent', operator: 'gte', value: 50000 }]), active: true },
      ]);

      const result = await service.getCustomerSegments('company-1', 'cust-1');
      expect(result).toEqual([]);
    });

    it('deve retornar segmento quando regra bater', async () => {
      prisma.customerSegment.findMany.mockResolvedValue([
        { id: 's1', name: 'Ativo', rules: JSON.stringify([{ field: 'totalPurchases', operator: 'gte', value: 1 }]), active: true },
      ]);

      const result = await service.getCustomerSegments('company-1', 'cust-1');
      expect(result).toContain('Ativo');
    });
  });
});

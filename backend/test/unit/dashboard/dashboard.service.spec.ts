import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../../src/modules/dashboard/dashboard.service';
import { CacheService } from '../../../src/modules/cache/cache.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;
  let cache: any;

  const baseFilter = {
    companyId: 'company-1',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  };

  beforeEach(async () => {
    prisma = {
      payment: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 10000 } }),
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      appointment: {
        count: jest.fn().mockResolvedValue(50),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      serviceOrder: {
        count: jest.fn().mockResolvedValue(30),
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      serviceOrderItem: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      cashTransaction: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      customer: {
        count: jest.fn().mockResolvedValue(10),
      },
      stock: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      stockMovement: {
        aggregate: jest.fn().mockResolvedValue({ _count: 0 }),
      },
      professional: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      service: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      businessHour: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      financialAccount: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    cache = { getOrSet: jest.fn((_key, fn) => fn()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('summary', () => {
    it('deve retornar resumo com receita, agendamentos e clientes', async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
      prisma.appointment.count.mockResolvedValue(100);
      prisma.serviceOrder.count.mockResolvedValue(80);
      prisma.serviceOrder.findMany.mockResolvedValue(
        Array.from({ length: 40 }, (_, i) => ({ customerId: `cust-${i}` })),
      );

      const result = await service.summary(baseFilter);
      expect(result.revenue).toBe(5000);
      expect(result.appointments).toBe(100);
      expect(result.completedServices).toBe(80);
      expect(result.customers).toBe(40);
      expect(result.averageTicket).toBe(62.5);
    });
  });

  describe('financial', () => {
    it('deve retornar dados financeiros com entradas e saídas', async () => {
      prisma.payment.groupBy.mockResolvedValue([
        { paymentMethod: 'CREDIT_CARD', _sum: { amount: 3000 }, _count: 10 },
      ]);
      prisma.cashTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 2000 } });

      const result = await service.financial(baseFilter);
      expect(result.payments).toHaveLength(1);
      expect(result.entries).toBe(5000);
      expect(result.exits).toBe(2000);
      expect(result.balance).toBe(3000);
    });
  });

  describe('operations', () => {
    it('deve retornar agrupamentos de status', async () => {
      prisma.appointment.groupBy.mockResolvedValue([
        { status: 'SCHEDULED', _count: 20 },
        { status: 'COMPLETED', _count: 30 },
      ]);
      prisma.serviceOrder.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: 25 },
      ]);

      const result = await service.operations(baseFilter);
      expect(result.appointments).toHaveLength(2);
      expect(result.serviceOrders).toHaveLength(1);
    });
  });

  describe('professionals', () => {
    it('deve retornar desempenho por profissional', async () => {
      prisma.serviceOrder.groupBy.mockResolvedValue([
        { professionalId: 'prof-1', _count: 15, _sum: { total: 750 } },
      ]);
      prisma.professional.findMany.mockResolvedValue([
        { id: 'prof-1', name: 'Carlos' },
      ]);

      const result = await service.professionals(baseFilter);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Carlos');
      expect(result[0].appointments).toBe(15);
      expect(result[0].revenue).toBe(750);
    });
  });

  describe('services', () => {
    it('deve retornar serviços mais realizados', async () => {
      prisma.serviceOrderItem.groupBy.mockResolvedValue([
        { serviceId: 'svc-1', _sum: { quantity: 30, totalPrice: 1500 }, _count: 20 },
      ]);
      prisma.service.findMany.mockResolvedValue([
        { id: 'svc-1', name: 'Corte' },
      ]);

      const result = await service.services(baseFilter);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Corte');
    });
  });

  describe('stock', () => {
    it('deve retornar situação do estoque', async () => {
      prisma.stock.findMany.mockResolvedValue([
        { quantity: 10, product: { id: 'p1', name: 'Shampoo' } },
        { quantity: 0, product: { id: 'p2', name: 'Condicionador' } },
      ]);
      prisma.stockMovement.aggregate.mockResolvedValue({ _count: 5 });

      const result = await service.stock(baseFilter);
      expect(result.totalProducts).toBe(2);
      expect(result.totalQuantity).toBe(10);
      expect(result.criticalProducts).toHaveLength(1);
      expect(result.movements).toBe(5);
    });
  });

  describe('overview', () => {
    it('deve retornar overview com crescimento e taxa de cancelamento', async () => {
      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } })
        .mockResolvedValueOnce({ _sum: { amount: 8000 } });
      prisma.appointment.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(10);
      prisma.serviceOrder.groupBy.mockResolvedValue(
        Array.from({ length: 60 }, (_, i) => ({ customerId: `c${i}` })),
      );
      prisma.customer.count.mockResolvedValue(15);

      const result = await service.overview(baseFilter);
      expect(result.revenueTotal).toBe(10000);
      expect(result.revenueGrowth).toBe(25);
      expect(result.appointmentsTotal).toBe(100);
      expect(result.completedAppointments).toBe(70);
      expect(result.cancellationRate).toBe(10);
      expect(result.averageTicket).toBeCloseTo(142.86, 1);
      expect(result.activeCustomers).toBe(60);
      expect(result.newCustomers).toBe(15);
    });
  });

  describe('revenueChart', () => {
    it('deve retornar receita agrupada por período', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { amount: 100, createdAt: new Date('2026-06-01'), paymentMethod: 'CREDIT_CARD' },
        { amount: 200, createdAt: new Date('2026-06-15'), paymentMethod: 'PIX' },
        { amount: 150, createdAt: new Date('2026-07-01'), paymentMethod: 'CREDIT_CARD' },
      ]);

      const result = await service.revenueChart({
        ...baseFilter,
        startDate: '2026-06-01',
        endDate: '2026-07-31',
      });
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].revenue).toBeDefined();
    });
  });

  describe('topServices', () => {
    it('deve retornar top 10 serviços', async () => {
      prisma.serviceOrderItem.groupBy.mockResolvedValue([
        { serviceId: 'svc-1', _sum: { quantity: 50, totalPrice: 2500 }, _count: 40 },
      ]);
      prisma.service.findMany.mockResolvedValue([
        { id: 'svc-1', name: 'Corte Degradê' },
      ]);

      const result = await service.topServices(baseFilter);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Corte Degradê');
    });
  });

  describe('professionalsRanking', () => {
    it('deve retornar top 10 profissionais', async () => {
      prisma.serviceOrder.groupBy.mockResolvedValue([
        { professionalId: 'prof-1', _count: 20, _sum: { total: 1000 } },
      ]);
      prisma.professional.findMany.mockResolvedValue([
        { id: 'prof-1', name: 'Ana' },
      ]);

      const result = await service.professionalsRanking(baseFilter);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ana');
      expect(result[0].averageTicket).toBe(50);
    });
  });

  describe('occupancy', () => {
    it('deve calcular taxa de ocupação', async () => {
      prisma.businessHour.findMany.mockResolvedValue([
        { startTime: '08:00', endTime: '18:00', active: true },
      ]);
      prisma.appointment.count.mockResolvedValue(40);

      const result = await service.occupancy(baseFilter);
      expect(result.totalSlots).toBe(40);
      expect(result.occupiedSlots).toBe(40);
      expect(result.occupancyPercentage).toBe(100);
    });
  });

  describe('financialAnalysis', () => {
    it('deve retornar análise financeira completa', async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 20000 } });
      prisma.cashTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 15000 } })
        .mockResolvedValueOnce({ _sum: { amount: 8000 } });
      prisma.financialAccount.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 3000 } });

      const result = await service.financialAnalysis(baseFilter);
      expect(result.revenue).toBe(20000);
      expect(result.expenses).toBe(8000);
      expect(result.profit).toBe(12000);
      expect(result.receivables).toBe(5000);
      expect(result.payables).toBe(3000);
      expect(result.cashBalance).toBe(7000);
    });
  });

  describe('stockAnalysis', () => {
    it('deve retornar análise de estoque', async () => {
      prisma.stock.findMany.mockResolvedValue([
        { quantity: 10, product: { id: 'p1', name: 'Shampoo', costPrice: 15, salePrice: 30 } },
        { quantity: 2, product: { id: 'p2', name: 'Condicionador', costPrice: 12, salePrice: 25 } },
        { quantity: 0, product: { id: 'p3', name: 'Cera', costPrice: 8, salePrice: 20 } },
      ]);

      const result = await service.stockAnalysis(baseFilter);
      expect(result.totalProducts).toBe(3);
      expect(result.lowStockCount).toBe(2);
      expect(result.stockValue).toBe(174);
      expect(result.topMovements).toBe(2);
    });
  });

  describe('alerts', () => {
    it('deve retornar alertas de estoque baixo', async () => {
      prisma.stock.findMany.mockResolvedValue([
        { quantity: 2, product: { name: 'Shampoo' } },
      ]);
      prisma.financialAccount.count.mockResolvedValue(0);
      prisma.businessHour.findMany.mockResolvedValue([
        { startTime: '08:00', endTime: '18:00', active: true },
      ]);

      const result = await service.alerts(baseFilter);
      expect(result.some((a) => a.type === 'STOCK')).toBe(true);
    });

    it('deve retornar alerta de contas vencidas', async () => {
      prisma.stock.findMany.mockResolvedValue([]);
      prisma.financialAccount.count.mockResolvedValue(3);
      prisma.businessHour.findMany.mockResolvedValue([
        { startTime: '08:00', endTime: '18:00', active: true },
      ]);

      const result = await service.alerts(baseFilter);
      expect(result.some((a) => a.type === 'FINANCIAL')).toBe(true);
    });

    it('deve retornar alerta de ocupação baixa', async () => {
      prisma.stock.findMany.mockResolvedValue([]);
      prisma.financialAccount.count.mockResolvedValue(0);
      prisma.businessHour.findMany.mockResolvedValue([
        { startTime: '08:00', endTime: '12:00', active: true },
      ]);
      prisma.appointment.count.mockResolvedValue(2);

      const result = await service.alerts(baseFilter);
      expect(result.some((a) => a.type === 'SCHEDULE')).toBe(true);
    });
  });
});

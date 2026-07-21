export type DashboardFilter = {
  companyId: string;
  unitId?: string;
  startDate?: string;
  endDate?: string;
};

export type SummaryData = {
  revenue: number;
  appointments: number;
  completedServices: number;
  averageTicket: number;
  customers: number;
};

export type PaymentByMethod = {
  method: string;
  amount: number;
  count: number;
};

export type FinancialData = {
  payments: PaymentByMethod[];
  entries: number;
  exits: number;
  balance: number;
};

export type StatusCount = {
  status: string;
  count: number;
};

export type OperationsData = {
  appointments: StatusCount[];
  serviceOrders: StatusCount[];
};

export type ProfessionalData = {
  professionalId: string;
  name: string;
  appointments: number;
  revenue: number;
};

export type ServiceData = {
  serviceId: string;
  name: string;
  quantity: number;
  revenue: number;
  orders: number;
};

export type CriticalProduct = {
  name: string;
  quantity: number;
};

export type StockData = {
  totalProducts: number;
  totalQuantity: number;
  criticalProducts: CriticalProduct[];
  movements: number;
};

// ── New Analytics Types ──

export type OverviewData = {
  revenueTotal: number;
  revenueGrowth: number;
  appointmentsTotal: number;
  completedAppointments: number;
  cancellationRate: number;
  averageTicket: number;
  activeCustomers: number;
  newCustomers: number;
};

export type RevenueChartItem = {
  date: string;
  revenue: number;
  payments: number;
};

export type TopServiceItem = {
  serviceId: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type ProfessionalRankingItem = {
  professionalId: string;
  name: string;
  appointments: number;
  completed: number;
  revenue: number;
  averageTicket: number;
};

export type OccupancyData = {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  occupancyPercentage: number;
};

export type FinancialAnalysisData = {
  revenue: number;
  expenses: number;
  profit: number;
  receivables: number;
  payables: number;
  cashBalance: number;
};

export type StockAnalysisData = {
  totalProducts: number;
  lowStockCount: number;
  stockValue: number;
  topMovements: number;
};

export type AlertItem = {
  type: string;
  severity: string;
  message: string;
};

export type DashboardFilter = {
  companyId: string;
  unitId?: string;
  startDate: string;
  endDate: string;
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

import { apiGet } from './api';
import type {
  DashboardFilter,
  SummaryData,
  FinancialData,
  OperationsData,
  ProfessionalData,
  ServiceData,
  StockData,
} from '@/types/dashboard';

function pick(filter: DashboardFilter) {
  return {
    companyId: filter.companyId,
    unitId: filter.unitId,
    startDate: filter.startDate,
    endDate: filter.endDate,
  };
}

export function fetchSummary(filter: DashboardFilter) {
  return apiGet<SummaryData>('/api/dashboard/summary', pick(filter));
}

export function fetchFinancial(filter: DashboardFilter) {
  return apiGet<FinancialData>('/api/dashboard/financial', pick(filter));
}

export function fetchOperations(filter: DashboardFilter) {
  return apiGet<OperationsData>('/api/dashboard/operations', pick(filter));
}

export function fetchProfessionals(filter: DashboardFilter) {
  return apiGet<ProfessionalData[]>('/api/dashboard/professionals', pick(filter));
}

export function fetchServices(filter: DashboardFilter) {
  return apiGet<ServiceData[]>('/api/dashboard/services', pick(filter));
}

export function fetchStock(filter: DashboardFilter) {
  return apiGet<StockData>('/api/dashboard/stock', pick(filter));
}

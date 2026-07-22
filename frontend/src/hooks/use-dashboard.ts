import { useQuery } from '@tanstack/react-query';
import {
  fetchSummary,
  fetchFinancial,
  fetchOperations,
  fetchProfessionals,
  fetchServices,
  fetchStock,
  fetchOverview,
  fetchRevenueChart,
  fetchTopServices,
  fetchProfessionalsRanking,
  fetchOccupancy,
  fetchFinancialAnalysis,
  fetchStockAnalysis,
  fetchAlerts,
} from '@/lib/dashboard';

type Filter = { unitId?: string; startDate?: string; endDate?: string };

function key(name: string, filter: Filter) {
  return ['dashboard', name, filter];
}

export function useDashboardSummary(filter: Filter) {
  return useQuery({ queryKey: key('summary', filter), queryFn: () => fetchSummary(filter) });
}

export function useDashboardFinancial(filter: Filter) {
  return useQuery({ queryKey: key('financial', filter), queryFn: () => fetchFinancial(filter) });
}

export function useDashboardOperations(filter: Filter) {
  return useQuery({ queryKey: key('operations', filter), queryFn: () => fetchOperations(filter) });
}

export function useDashboardProfessionals(filter: Filter) {
  return useQuery({ queryKey: key('professionals', filter), queryFn: () => fetchProfessionals(filter) });
}

export function useDashboardServices(filter: Filter) {
  return useQuery({ queryKey: key('services', filter), queryFn: () => fetchServices(filter) });
}

export function useDashboardStock(filter: Filter) {
  return useQuery({ queryKey: key('stock', filter), queryFn: () => fetchStock(filter) });
}

export function useDashboardOverview(filter: Filter) {
  return useQuery({ queryKey: key('overview', filter), queryFn: () => fetchOverview(filter) });
}

export function useDashboardRevenueChart(filter: Filter) {
  return useQuery({ queryKey: key('revenue-chart', filter), queryFn: () => fetchRevenueChart(filter) });
}

export function useDashboardTopServices(filter: Filter) {
  return useQuery({ queryKey: key('top-services', filter), queryFn: () => fetchTopServices(filter) });
}

export function useDashboardProfessionalsRanking(filter: Filter) {
  return useQuery({ queryKey: key('professionals-ranking', filter), queryFn: () => fetchProfessionalsRanking(filter) });
}

export function useDashboardOccupancy(filter: Filter) {
  return useQuery({ queryKey: key('occupancy', filter), queryFn: () => fetchOccupancy(filter) });
}

export function useDashboardFinancialAnalysis(filter: Filter) {
  return useQuery({ queryKey: key('financial-analysis', filter), queryFn: () => fetchFinancialAnalysis(filter) });
}

export function useDashboardStockAnalysis(filter: Filter) {
  return useQuery({ queryKey: key('stock-analysis', filter), queryFn: () => fetchStockAnalysis(filter) });
}

export function useDashboardAlerts(filter: Pick<Filter, 'unitId'>) {
  return useQuery({ queryKey: key('alerts', filter), queryFn: () => fetchAlerts(filter) });
}

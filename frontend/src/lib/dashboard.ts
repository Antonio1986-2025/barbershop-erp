import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function pick(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return { unitId: filter.unitId, startDate: filter.startDate, endDate: filter.endDate };
}

export function fetchSummary(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any>('/api/dashboard/summary', pick(filter));
}

export function fetchFinancial(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any>('/api/dashboard/financial', pick(filter));
}

export function fetchOperations(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any>('/api/dashboard/operations', pick(filter));
}

export function fetchProfessionals(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any[]>('/api/dashboard/professionals', pick(filter));
}

export function fetchServices(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any[]>('/api/dashboard/services', pick(filter));
}

export function fetchStock(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any>('/api/dashboard/stock', pick(filter));
}

// ── New Analytics ──

export function fetchOverview(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any>('/api/dashboard/overview', pick(filter));
}

export function fetchRevenueChart(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any[]>('/api/dashboard/revenue-chart', pick(filter));
}

export function fetchTopServices(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any[]>('/api/dashboard/top-services', pick(filter));
}

export function fetchProfessionalsRanking(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any[]>('/api/dashboard/professionals-ranking', pick(filter));
}

export function fetchOccupancy(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any>('/api/dashboard/occupancy', pick(filter));
}

export function fetchFinancialAnalysis(filter: { unitId?: string; startDate?: string; endDate?: string }) {
  return apiGet<any>('/api/dashboard/financial-analysis', pick(filter));
}

export function fetchStockAnalysis(filter: { unitId?: string }) {
  return apiGet<any>('/api/dashboard/stock-analysis', pick(filter));
}

export function fetchAlerts(filter: { unitId?: string }) {
  return apiGet<any[]>('/api/dashboard/alerts', pick(filter));
}

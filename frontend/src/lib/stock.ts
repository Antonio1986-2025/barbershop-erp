import { getToken } from './auth';

function getApiBase(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return process.env.NEXT_PUBLIC_API_URL ?? `http://${window.location.hostname}:3001`;
}


function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface StockMovement {
  id: string;
  companyId: string;
  unitId: string;
  productId: string;
  type: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  balanceBefore: number;
  balanceAfter: number;
  avgCostBefore: number | null;
  avgCostAfter: number | null;
  referenceId: string | null;
  referenceType: string | null;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string; barcode: string };
  unit: { id: string; name: string };
}

export interface DashboardCards {
  totalValue: number;
  totalProducts: number;
  lowStock: number;
  zeroStock: number;
  inactiveProducts: number;
  inTransit: number;
  monthlyPurchases: number;
  avgTurnover: number;
  openAlerts: number;
}

export interface ReportQuery {
  unitId?: string;
  productId?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  format?: string;
}

export async function fetchDashboardCards(): Promise<DashboardCards> {
  const res = await fetch(`/api/stock/dashboard/cards`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDashboardCharts(): Promise<any> {
  const res = await fetch(`/api/stock/dashboard/charts`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDashboardRankings(): Promise<any> {
  const res = await fetch(`/api/stock/dashboard/rankings`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDashboardAlerts(): Promise<any> {
  const res = await fetch(`/api/stock/dashboard/alerts`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMovements(params: {
  page?: number; limit?: number; productId?: string; unitId?: string;
  type?: string; startDate?: string; endDate?: string;
}): Promise<{ data: StockMovement[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const url = new URL(`/api/stock/movements`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adjustStock(data: {
  unitId: string; productId: string; quantity: number; unitCost?: number; description?: string;
}): Promise<StockMovement> {
  const res = await fetch(`/api/stock/adjust`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCurrentStock(params: ReportQuery): Promise<{ data: any[]; totalValue: number; totalItems: number }> {
  const url = new URL(`/api/stock/reports/current-stock`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchLowStock(params: ReportQuery): Promise<{ data: any[]; totalItems: number }> {
  const url = new URL(`/api/stock/reports/low-stock`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchProductStock(productId: string): Promise<any> {
  const res = await fetch(`/api/stock/products/${productId}/stock`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Compra',
  RETURN: 'Devolução',
  TRANSFER_IN: 'Transferência (entrada)',
  ADJUSTMENT: 'Ajuste',
  SALE: 'Venda',
  CONSUMPTION: 'Consumo',
  TRANSFER_OUT: 'Transferência (saída)',
  LOSS: 'Perda',
};

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  PURCHASE: 'text-green-600 bg-green-50',
  RETURN: 'text-blue-600 bg-blue-50',
  TRANSFER_IN: 'text-purple-600 bg-purple-50',
  ADJUSTMENT: 'text-yellow-600 bg-yellow-50',
  SALE: 'text-red-600 bg-red-50',
  CONSUMPTION: 'text-orange-600 bg-orange-50',
  TRANSFER_OUT: 'text-purple-600 bg-purple-50',
  LOSS: 'text-red-700 bg-red-100',
};

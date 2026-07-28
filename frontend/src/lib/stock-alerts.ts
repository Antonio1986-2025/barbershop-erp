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

export interface StockAlert {
  id: string;
  companyId: string;
  unitId: string;
  productId: string;
  type: string;
  message: string | null;
  details: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  unit: { id: string; name: string };
  product: { id: string; name: string; barcode: string };
}

export const ALERT_TYPE_LABELS: Record<string, string> = {
  LOW_STOCK: 'Estoque Baixo',
  ZERO_STOCK: 'Estoque Zerado',
  NEGATIVE_STOCK: 'Estoque Negativo',
  INACTIVE_PRODUCT: 'Produto Inativo',
  EXPIRING_PRODUCT: 'Produto Próximo ao Vencimento',
};

export const ALERT_TYPE_COLORS: Record<string, string> = {
  LOW_STOCK: 'text-yellow-600 bg-yellow-50',
  ZERO_STOCK: 'text-red-600 bg-red-50',
  NEGATIVE_STOCK: 'text-red-700 bg-red-100',
  INACTIVE_PRODUCT: 'text-zinc-600 bg-zinc-100',
  EXPIRING_PRODUCT: 'text-orange-600 bg-orange-50',
};

export async function fetchAlerts(params: {
  page?: number; limit?: number; unitId?: string; productId?: string;
  type?: string; resolved?: boolean; startDate?: string; endDate?: string;
}): Promise<{ data: StockAlert[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const url = new URL(`/api/stock/alerts`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchOpenAlertCount(): Promise<number> {
  const res = await fetch(`/api/stock/alerts/count/open`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function resolveAlert(id: string): Promise<StockAlert> {
  const res = await fetch(`/api/stock/alerts/${id}/resolve`, {
    method: 'PATCH', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function checkAlerts(): Promise<{ alertsCreated: number; alertsResolved: number }> {
  const res = await fetch(`/api/stock/alerts/check`, {
    method: 'POST', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

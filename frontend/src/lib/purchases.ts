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

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string };
}

export interface Purchase {
  id: string;
  companyId: string;
  unitId: string;
  supplierId: string;
  status: string;
  invoiceNumber: string | null;
  notes: string | null;
  totalAmount: number;
  createdBy: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: { id: string; name: string };
  unit: { id: string; name: string };
  items: PurchaseItem[];
}

export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

export const PURCHASE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-zinc-600 bg-zinc-100',
  CONFIRMED: 'text-green-600 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
};

export async function fetchPurchases(params: {
  page?: number; limit?: number; status?: string; supplierId?: string;
  startDate?: string; endDate?: string; orderBy?: string; orderDir?: string;
}): Promise<{ data: Purchase[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const url = new URL(`/api/purchases`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchPurchase(id: string): Promise<Purchase> {
  const res = await fetch(`/api/purchases/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createPurchase(data: {
  supplierId: string; unitId: string; invoiceNumber?: string; notes?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}): Promise<Purchase> {
  const res = await fetch(`/api/purchases`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmPurchase(id: string): Promise<Purchase> {
  const res = await fetch(`/api/purchases/${id}/confirm`, {
    method: 'POST', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelPurchase(id: string, reason?: string): Promise<Purchase> {
  const res = await fetch(`/api/purchases/${id}/cancel`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

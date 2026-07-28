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

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  serviceId: string | null;
  productName: string;
  productBarcode: string | null;
  serviceName: string | null;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  discountAmount: number;
  createdAt: string;
  product?: { id: string; name: string } | null;
  service?: { id: string; name: string } | null;
}

export interface Payment {
  id: string;
  companyId: string;
  unitId: string;
  saleId: string;
  amount: number;
  paymentMethod: 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'STORE_CREDIT' | 'GIFT_CARD';
  status: string;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  companyId: string;
  unitId: string;
  customerId: string | null;
  status: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  createdBy: string;
  updatedBy: string | null;
  cancelledBy: string | null;
  refundedBy: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
  updatedAt: string;
  unit?: { id: string; name: string };
  customer?: { id: string; name: string; phone?: string } | null;
  items: SaleItem[];
  payments?: Payment[];
}

export interface SaleMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface SaleListResponse {
  data: Sale[];
  meta: SaleMeta;
}

export const SALE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberto',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const SALE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-zinc-600 bg-zinc-100',
  OPEN: 'text-blue-600 bg-blue-50',
  PAID: 'text-green-600 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
  REFUNDED: 'text-orange-600 bg-orange-50',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  STORE_CREDIT: 'Crédito da Loja',
  GIFT_CARD: 'Vale Presente',
};

export async function fetchSales(params: {
  page?: number; limit?: number; status?: string;
  customerId?: string; unitId?: string;
  startDate?: string; endDate?: string;
  orderBy?: string; orderDir?: string;
}): Promise<SaleListResponse> {
  const url = new URL(`/api/sales`, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSale(id: string): Promise<Sale> {
  const res = await fetch(`/api/sales/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createSale(data: {
  unitId: string;
  customerId?: string;
  notes?: string;
  items: { productId?: string; serviceId?: string; quantity: number; unitPrice: number }[];
}): Promise<Sale> {
  const res = await fetch(`/api/sales`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function openSale(id: string): Promise<Sale> {
  const res = await fetch(`/api/sales/${id}/open`, {
    method: 'PATCH', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelSale(id: string, reason?: string): Promise<Sale> {
  const res = await fetch(`/api/sales/${id}/cancel`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function refundSale(id: string, reason?: string): Promise<Sale> {
  const res = await fetch(`/api/sales/${id}/refund`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addSaleItem(saleId: string, data: {
  productId?: string; serviceId?: string; quantity: number; unitPrice: number;
}): Promise<SaleItem> {
  const res = await fetch(`/api/sales/${saleId}/items`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSaleItem(saleId: string, itemId: string, data: {
  quantity: number;
}): Promise<SaleItem> {
  const res = await fetch(`/api/sales/${saleId}/items/${itemId}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removeSaleItem(saleId: string, itemId: string): Promise<void> {
  const res = await fetch(`/api/sales/${saleId}/items/${itemId}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function createPayment(saleId: string, data: {
  amount: number; paymentMethod: string;
}): Promise<Payment> {
  const res = await fetch(`/api/sales/${saleId}/payments`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchPayments(saleId: string): Promise<Payment[]> {
  const res = await fetch(`/api/sales/${saleId}/payments`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelPayment(id: string): Promise<Payment> {
  const res = await fetch(`/api/payments/${id}/cancel`, {
    method: 'PATCH', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

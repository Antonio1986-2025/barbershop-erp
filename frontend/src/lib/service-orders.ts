import { getToken } from './auth';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ServiceOrder {
  id: string;
  companyId: string;
  unitId: string;
  appointmentId?: string;
  customerId: string;
  professionalId: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  couponId?: string;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string };
  professional?: { id: string; name: string };
  unit?: { id: string; name: string };
  items?: any[];
  payments?: any[];
}

export interface ServiceOrderListResponse {
  data: ServiceOrder[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function fetchServiceOrders(params: {
  page?: number;
  limit?: number;
  unitId?: string;
  customerId?: string;
  professionalId?: string;
  status?: string;
} = {}): Promise<ServiceOrderListResponse> {
  const url = new URL(`/api/service-orders`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchServiceOrder(id: string): Promise<ServiceOrder> {
  const res = await fetch(`/api/service-orders/${id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createServiceOrder(data: {
  customerId: string;
  professionalId: string;
  unitId: string;
  serviceId?: string;
  items?: { serviceId?: string; productId?: string; quantity: number; unitPrice: number }[];
  notes?: string;
}): Promise<ServiceOrder> {
  const res = await fetch(`/api/service-orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateServiceOrder(
  id: string,
  data: Partial<ServiceOrder>,
): Promise<ServiceOrder> {
  const res = await fetch(`/api/service-orders/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelServiceOrder(id: string, reason?: string): Promise<void> {
  const res = await fetch(`/api/service-orders/${id}/cancel`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function generateSaleFromOrder(id: string): Promise<any> {
  const res = await fetch(`/api/service-orders/${id}/generate-sale`, {
    method: 'POST',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Service {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  commissionType: string | null;
  commissionValue: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

export interface ServiceMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServiceListResponse {
  data: Service[];
  meta: ServiceMeta;
}

export async function fetchServices(params: {
  page?: number;
  limit?: number;
  search?: string;
  active?: string;
  orderBy?: string;
  orderDir?: string;
}): Promise<ServiceListResponse> {
  const url = new URL(`${API_BASE}/api/services`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchService(id: string): Promise<Service> {
  const res = await fetch(`${API_BASE}/api/services/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createService(data: {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  commissionType?: string;
  commissionValue?: number;
}): Promise<Service> {
  const res = await fetch(`${API_BASE}/api/services`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    description?: string;
    durationMinutes?: number;
    price?: number;
    commissionType?: string;
    commissionValue?: number;
  },
): Promise<Service> {
  const res = await fetch(`${API_BASE}/api/services/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteService(id: string): Promise<Service> {
  const res = await fetch(`${API_BASE}/api/services/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Unit {
  id: string;
  companyId: string;
  name: string;
  code: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  status: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface UnitMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface UnitListResponse {
  data: Unit[];
  meta: UnitMeta;
}

export async function fetchUnits(params?: {
  page?: number; limit?: number; search?: string; status?: string;
  orderBy?: string; orderDir?: string;
}): Promise<UnitListResponse> {
  const url = new URL(`${API_BASE}/api/units`);
  if (!params) {
    url.searchParams.set('simple', 'true');
  } else {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchUnitsSimple(): Promise<{ id: string; name: string; code: string }[]> {
  const res = await fetch(`${API_BASE}/api/units?simple=true`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchUnit(id: string): Promise<Unit> {
  const res = await fetch(`${API_BASE}/api/units/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createUnit(data: {
  name: string; code: string; phone?: string; email?: string;
  address?: string; number?: string; complement?: string;
  neighborhood?: string; city?: string; state?: string; zipCode?: string;
  document?: string; status?: string;
}): Promise<Unit> {
  const res = await fetch(`${API_BASE}/api/units`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUnit(id: string, data: Partial<{
  name: string; code: string; phone: string; email: string;
  address: string; number: string; complement: string;
  neighborhood: string; city: string; state: string; zipCode: string;
  document: string; status: string;
}>): Promise<Unit> {
  const res = await fetch(`${API_BASE}/api/units/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteUnit(id: string): Promise<Unit> {
  const res = await fetch(`${API_BASE}/api/units/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

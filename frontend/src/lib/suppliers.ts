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

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  contact: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

export async function fetchSuppliers(params: {
  page?: number; limit?: number; search?: string; active?: string;
  orderBy?: string; orderDir?: string;
}): Promise<{ data: Supplier[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const url = new URL(`/api/suppliers`, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSupplier(id: string): Promise<Supplier> {
  const res = await fetch(`/api/suppliers/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createSupplier(data: {
  name: string; document?: string; email?: string; phone?: string; contact?: string; notes?: string;
}): Promise<Supplier> {
  const res = await fetch(`/api/suppliers`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSupplier(id: string, data: {
  name?: string; document?: string; email?: string; phone?: string; contact?: string; notes?: string;
}): Promise<Supplier> {
  const res = await fetch(`/api/suppliers/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSupplier(id: string): Promise<Supplier> {
  const res = await fetch(`/api/suppliers/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

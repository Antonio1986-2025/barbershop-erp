import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CompanyPlan {
  id: string; name: string; code: string;
}

export interface CompanySubscription {
  id: string;
  plan: CompanyPlan;
  status: string;
  startDate: string;
  endDate: string | null;
  canceledAt: string | null;
}

export interface CompanySettings {
  id: string;
  createdAt: string;
}

export interface Company {
  id: string;
  corporateName: string;
  tradeName: string | null;
  document: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  deletedAt: string | null;
  settings: CompanySettings | null;
  subscription: CompanySubscription;
}

export interface CompanyMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface CompanyListResponse {
  data: Company[];
  meta: CompanyMeta;
}

export async function fetchCompanies(params: {
  page?: number; limit?: number; search?: string; status?: string;
  orderBy?: string; orderDir?: string;
}): Promise<CompanyListResponse> {
  const url = new URL(`${API_BASE}/api/companies`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCompany(id: string): Promise<Company> {
  const res = await fetch(`${API_BASE}/api/companies/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCompany(data: {
  corporateName: string; document: string; email: string;
  tradeName?: string; phone?: string; status?: string;
}): Promise<Company> {
  const res = await fetch(`${API_BASE}/api/companies`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCompany(id: string, data: Partial<{
  corporateName: string; tradeName: string; document: string; email: string;
  phone: string; status: string;
}>): Promise<Company> {
  const res = await fetch(`${API_BASE}/api/companies/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCompany(id: string): Promise<Company> {
  const res = await fetch(`${API_BASE}/api/companies/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

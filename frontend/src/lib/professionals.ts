import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ProfessionalUnit {
  id: string;
  professionalId: string;
  unitId: string;
  active: boolean;
  unit: { id: string; name: string };
}

export interface Professional {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  specialty: string | null;
  commissionRate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  units: ProfessionalUnit[];
}

export interface ProfessionalMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProfessionalListResponse {
  data: Professional[];
  meta: ProfessionalMeta;
}

export async function fetchProfessionals(params: {
  page?: number;
  limit?: number;
  search?: string;
  active?: string;
  unitId?: string;
  orderBy?: string;
  orderDir?: string;
}): Promise<ProfessionalListResponse> {
  const url = new URL(`${API_BASE}/api/professionals`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchProfessional(id: string): Promise<Professional> {
  const res = await fetch(`${API_BASE}/api/professionals/${id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createProfessional(
  data: { name: string; email?: string; phone?: string; document?: string; specialty?: string; unitIds?: string[] },
): Promise<Professional> {
  const res = await fetch(`${API_BASE}/api/professionals`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProfessional(
  id: string,
  data: { name?: string; email?: string; phone?: string; document?: string; specialty?: string; unitIds?: string[] },
): Promise<Professional> {
  const res = await fetch(`${API_BASE}/api/professionals/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProfessional(id: string): Promise<Professional> {
  const res = await fetch(`${API_BASE}/api/professionals/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

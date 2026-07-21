import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface CategoryMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface CategoryListResponse {
  data: Category[];
  meta: CategoryMeta;
}

export async function fetchCategories(params: {
  page?: number; limit?: number; search?: string; active?: string;
  orderBy?: string; orderDir?: string;
}): Promise<CategoryListResponse> {
  const url = new URL(`${API_BASE}/api/categories`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCategory(id: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/categories/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCategory(data: { name: string; description?: string }): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/categories`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCategory(id: string, data: { name?: string; description?: string }): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/categories/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCategory(id: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/categories/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

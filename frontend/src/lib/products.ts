import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  barcode: string | null;
  categoryId: string | null;
  category: ProductCategory | null;
  costPrice: number;
  salePrice: number;
  active: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface ProductMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface ProductListResponse {
  data: Product[];
  meta: ProductMeta;
}

export async function fetchProducts(params: {
  page?: number; limit?: number; search?: string; active?: string; categoryId?: string;
  orderBy?: string; orderDir?: string;
}): Promise<ProductListResponse> {
  const url = new URL(`${API_BASE}/api/products`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createProduct(data: {
  name: string; barcode?: string; categoryId?: string; costPrice: number; salePrice: number;
}): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProduct(id: string, data: {
  name?: string; barcode?: string; categoryId?: string; costPrice?: number; salePrice?: number;
}): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

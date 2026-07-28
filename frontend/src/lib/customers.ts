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

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  birthDate: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

export interface CustomerMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomerListResponse {
  data: Customer[];
  meta: CustomerMeta;
}

export async function fetchCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
  active?: string;
  orderBy?: string;
  orderDir?: string;
}): Promise<CustomerListResponse> {
  const url = new URL(`/api/customers`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Busca um cliente pelo telefone (fluxo telefone-primeiro).
 * Retorna o cliente se existir, ou null se não encontrar.
 */
export async function fetchCustomerByPhone(phone: string): Promise<Customer | null> {
  const res = await fetch(`/api/customers/search?phone=${encodeURIComponent(phone)}`, {
    headers: headers(),
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCustomer(
  data: Partial<Customer>,
): Promise<Customer> {
  const res = await fetch(`/api/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCustomer(
  id: string,
  data: Partial<Customer>,
): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

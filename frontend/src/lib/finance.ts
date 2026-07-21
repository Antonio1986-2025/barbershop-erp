import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface FinancialCategory {
  id: string;
  companyId: string;
  name: string;
  type: string;
  active: boolean;
}

export interface FinancialAccount {
  id: string;
  companyId: string;
  categoryId: string;
  category: { id: string; name: string; type: string };
  description: string;
  type: string;
  status: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  paymentId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashClosing {
  id: string;
  companyId: string;
  unitId: string;
  cashRegisterId: string;
  openedAt: string;
  closedAt: string;
  openingAmount: number;
  closingAmount: number;
  expectedAmount: number;
  difference: number;
  closedBy: string;
  createdAt: string;
  unit: { id: string; name: string };
}

export interface CashFlow {
  period: { start: string; end: string };
  income: { total: number; paid: number; pending: number };
  expense: { total: number; paid: number; pending: number };
  balance: { expected: number; realized: number };
  cashFlow: { in: number; out: number; balance: number };
}

export interface AccountMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface AccountListResponse {
  data: FinancialAccount[];
  meta: AccountMeta;
}

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Em Aberto',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};

export const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

// Categories
export async function fetchCategories(): Promise<FinancialCategory[]> {
  const res = await fetch(`${API_BASE}/api/financial/categories`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCategory(data: { name: string; type: string }): Promise<FinancialCategory> {
  const res = await fetch(`${API_BASE}/api/financial/categories`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCategory(id: string, data: { name?: string; type?: string }): Promise<FinancialCategory> {
  const res = await fetch(`${API_BASE}/api/financial/categories/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/financial/categories/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
}

// Accounts
export async function fetchAccounts(params: {
  page?: number; limit?: number; type?: string; status?: string;
  categoryId?: string; startDate?: string; endDate?: string;
}): Promise<AccountListResponse> {
  const url = new URL(`${API_BASE}/api/financial/accounts`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createAccount(data: {
  categoryId: string; description: string; type: string;
  amount: number; dueDate: string;
}): Promise<FinancialAccount> {
  const res = await fetch(`${API_BASE}/api/financial/accounts`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateAccount(id: string, data: Partial<FinancialAccount>): Promise<FinancialAccount> {
  const res = await fetch(`${API_BASE}/api/financial/accounts/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function payAccount(id: string): Promise<FinancialAccount> {
  const res = await fetch(`${API_BASE}/api/financial/accounts/${id}/pay`, {
    method: 'PATCH', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelAccount(id: string): Promise<FinancialAccount> {
  const res = await fetch(`${API_BASE}/api/financial/accounts/${id}/cancel`, {
    method: 'PATCH', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Cash Flow
export async function fetchCashFlow(params: {
  unitId?: string; startDate?: string; endDate?: string;
}): Promise<CashFlow> {
  const url = new URL(`${API_BASE}/api/financial/cash-flow`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Cash Closing
export async function createCashClosing(data: {
  cashRegisterId: string; expectedAmount?: number; closingAmount?: number;
}): Promise<CashClosing> {
  const res = await fetch(`${API_BASE}/api/financial/cash-closing`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCashClosings(unitId?: string): Promise<CashClosing[]> {
  const params = unitId ? `?unitId=${unitId}` : '';
  const res = await fetch(`${API_BASE}/api/financial/cash-closing${params}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

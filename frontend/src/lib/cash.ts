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

export interface CashRegister {
  id: string;
  companyId: string;
  unitId: string;
  openedBy: string;
  closedBy: string | null;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  entries?: number;
  exits?: number;
  currentBalance?: number;
  transactionCount?: number;
}

export interface CashTransaction {
  id: string;
  companyId: string;
  unitId: string;
  cashRegisterId: string;
  type: 'ENTRY' | 'EXIT';
  amount: number;
  description: string;
  createdAt: string;
}

export interface CashSummary {
  id: string;
  unitId: string;
  status: string;
  openedBy: string;
  closedBy: string | null;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  entries: number;
  exits: number;
  expectedBalance: number;
  transactionCount: number;
  transactions: CashTransaction[];
  lastClosing: any | null;
}

export interface CashHistoryItem {
  id: string;
  unitId: string;
  status: string;
  openedBy: string;
  closedBy: string | null;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  transactionCount: number;
}

export async function fetchCurrentCash(unitId: string): Promise<CashSummary | null> {
  const res = await fetch(`/api/cash/current?unitId=${unitId}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function openCash(data: {
  unitId: string; openingAmount: number; notes?: string;
}): Promise<CashRegister> {
  const res = await fetch(`/api/cash/open`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function closeCash(id: string, data?: {
  closingAmount?: number; expectedAmount?: number;
}): Promise<any> {
  const res = await fetch(`/api/cash/${id}/close`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function reopenCash(id: string): Promise<CashRegister> {
  const res = await fetch(`/api/cash/${id}/reopen`, {
    method: 'POST', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function supplyCash(id: string, data: {
  amount: number; description: string;
}): Promise<CashTransaction> {
  const res = await fetch(`/api/cash/${id}/supply`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function withdrawCash(id: string, data: {
  amount: number; description: string;
}): Promise<CashTransaction> {
  const res = await fetch(`/api/cash/${id}/withdraw`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCashSummary(id: string): Promise<CashSummary> {
  const res = await fetch(`/api/cash/${id}/summary`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCashHistory(unitId?: string): Promise<CashHistoryItem[]> {
  const url = new URL(`/api/cash/history`);
  if (unitId) url.searchParams.set('unitId', unitId);
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

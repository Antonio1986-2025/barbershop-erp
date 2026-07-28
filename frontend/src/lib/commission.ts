import { getToken } from './auth';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Commission {
  id: string;
  companyId: string;
  unitId: string;
  saleId?: string;
  serviceOrderId?: string;
  professionalId: string;
  totalServiceAmount?: number;
  totalProductAmount?: number;
  commissionAmount: number;
  rateApplied?: number;
  rateType?: string;
  status: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectReason?: string;
  paidAt?: string;
  paidBy?: string;
  closingId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  professional?: { id: string; name: string };
}

export interface CommissionListResponse {
  data: Commission[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function fetchCommissions(params: {
  page?: number;
  limit?: number;
  status?: string;
  professionalId?: string;
  unitId?: string;
} = {}): Promise<CommissionListResponse> {
  const url = new URL(`/api/commission`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function approveCommission(id: string): Promise<void> {
  const res = await fetch(`/api/commission/${id}/approve`, {
    method: 'POST',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function rejectCommission(id: string, reason: string): Promise<void> {
  const res = await fetch(`/api/commission/${id}/reject`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchCommissionClosings(): Promise<any[]> {
  const res = await fetch(`/api/commission/closings`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  const d = await res.json();
  return d.data ?? [];
}

export async function closeCommissionPeriod(data: {
  unitId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<void> {
  const res = await fetch(`/api/commission/close-period`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}

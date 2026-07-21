import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface AuditMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface AuditListResponse {
  data: AuditLog[];
  meta: AuditMeta;
}

export async function fetchAuditLogs(params: {
  page?: number; limit?: number; entity?: string; action?: string;
  userId?: string; startDate?: string; endDate?: string;
}): Promise<AuditListResponse> {
  const url = new URL(`${API_BASE}/api/audit-logs`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface BusinessHour {
  id: string;
  companyId: string;
  unitId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface ScheduleBlock {
  id: string;
  companyId: string;
  unitId: string;
  professionalId: string | null;
  professional: { id: string; name: string } | null;
  title: string;
  reason: string | null;
  type: string;
  startAt: string;
  endAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export function dayLabel(n: number) { return DAYS[n] ?? n }

export async function fetchBusinessHours(companyId?: string, unitId?: string): Promise<BusinessHour[]> {
  const params = new URLSearchParams();
  if (unitId) params.set('unitId', unitId);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/schedule/business-hours${qs ? '?' + qs : ''}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createBusinessHour(data: {
  unitId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active?: boolean;
}): Promise<BusinessHour> {
  const res = await fetch(`${API_BASE}/api/schedule/business-hours`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateBusinessHour(id: string, data: Partial<BusinessHour>): Promise<BusinessHour> {
  const res = await fetch(`${API_BASE}/api/schedule/business-hours/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteBusinessHour(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/schedule/business-hours/${id}`, { method: 'DELETE', headers: headers() });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchScheduleBlocks(unitId?: string, professionalId?: string): Promise<ScheduleBlock[]> {
  const params = new URLSearchParams();
  if (unitId) params.set('unitId', unitId);
  if (professionalId) params.set('professionalId', professionalId);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/schedule/blocks${qs ? '?' + qs : ''}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createScheduleBlock(data: {
  unitId: string;
  professionalId?: string;
  title: string;
  reason?: string;
  type?: string;
  startAt: string;
  endAt: string;
}): Promise<ScheduleBlock> {
  const res = await fetch(`${API_BASE}/api/schedule/blocks`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateScheduleBlock(id: string, data: Partial<ScheduleBlock>): Promise<ScheduleBlock> {
  const res = await fetch(`${API_BASE}/api/schedule/blocks/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteScheduleBlock(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/schedule/blocks/${id}`, { method: 'DELETE', headers: headers() });
  if (!res.ok) throw new Error(await res.text());
}

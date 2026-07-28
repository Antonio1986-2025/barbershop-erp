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

export interface CompanySettings {
  id: string;
  companyId: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  displayName: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  timezone: string | null;
  currency: string | null;
  dateFormat: string | null;
  defaultAppointmentDuration: number | null;
  allowOnlineScheduling: boolean | null;
  cancellationLimitHours: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchSettings(): Promise<CompanySettings> {
  const res = await fetch(`/api/company-settings`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
  const res = await fetch(`/api/company-settings`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

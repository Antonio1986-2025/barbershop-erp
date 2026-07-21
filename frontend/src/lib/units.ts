import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Unit {
  id: string;
  name: string;
  code: string;
}

export async function fetchUnits(): Promise<Unit[]> {
  const res = await fetch(`${API_BASE}/api/units`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return body.data ?? body;
}

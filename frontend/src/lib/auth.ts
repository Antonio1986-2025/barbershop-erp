const ACCESS_TOKEN_KEY = 'barbershop_access_token';
const REFRESH_TOKEN_KEY = 'barbershop_refresh_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  document.cookie = `barbershop_token=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = 'barbershop_token=; path=/; max-age=0';
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    companyId: string;
    companyName: string;
    roles: string[];
    permissions: string[];
  };
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export async function refreshRequest(): Promise<RefreshResponse | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return data;
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
  clearToken();
}

export async function meRequest(token: string) {
  const res = await fetch(`/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

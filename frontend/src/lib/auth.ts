const ACCESS_TOKEN_KEY = 'barbershop_access_token';
const REFRESH_TOKEN_KEY = 'barbershop_refresh_token';

function getApiBase(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return process.env.NEXT_PUBLIC_API_URL ?? `http://${window.location.hostname}:3001`;
}

// ── Token helpers ──

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

export function setTokens(access: string, refresh: string) {
  setToken(access);
  setRefreshToken(refresh);
}

export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = 'barbershop_token=; path=/; max-age=0';
}

export { clearToken as removeTokens };

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

// ── API functions ──

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao fazer login' }));
    throw new Error(err.message);
  }
  return res.json();
}

export async function refreshRequest(): Promise<RefreshResponse | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${getApiBase()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data;
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${getApiBase()}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // silent
  }
  clearToken();
}

export async function meRequest(token: string) {
  const res = await fetch(`${getApiBase()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

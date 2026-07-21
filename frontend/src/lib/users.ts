import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface UserRole {
  role: { id: string; name: string; slug: string };
}

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  roles: UserRole[];
}

export interface UserMeta {
  page: number; limit: number; total: number; totalPages: number;
}

export interface UserListResponse {
  data: User[];
  meta: UserMeta;
}

export async function fetchUsers(params: {
  page?: number; limit?: number; search?: string; active?: string; roleId?: string;
  orderBy?: string; orderDir?: string;
}): Promise<UserListResponse> {
  const url = new URL(`${API_BASE}/api/users`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createUser(data: {
  name: string; email: string; password: string; roleIds?: string[];
}): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUser(id: string, data: {
  name?: string; email?: string; password?: string; roleIds?: string[];
}): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteUser(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

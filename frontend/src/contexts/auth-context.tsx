'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  getToken,
  setToken,
  setRefreshToken,
  clearToken,
  loginRequest,
  logoutRequest,
  meRequest,
  LoginResponse,
  getRefreshToken,
} from '@/lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await logoutRequest().catch(() => {});
    clearToken();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data: LoginResponse = await loginRequest(email, password);
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
    },
    [],
  );

  // Simplified: just use a mounted flag to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only run auth check after mount (client-side only)
    const init = async () => {
      const token = getToken();
      if (!token) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          setLoading(false);
          return;
        }
        try {
          const data = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/auth/refresh`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            },
          );
          if (data.ok) {
            const r = await data.json();
            setToken(r.accessToken);
            setRefreshToken(r.refreshToken);
            const me = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/auth/me`,
              { headers: { Authorization: `Bearer ${r.accessToken}` } },
            );
            if (me.ok) setUser(await me.json());
            else clearToken();
          }
        } catch {
          clearToken();
        }
        setLoading(false);
        return;
      }

      try {
        const me = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (me.ok) {
          setUser(await me.json());
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
      setLoading(false);
    };

    init();
  }, []);

  // Don't render children on server - prevents hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Carregando...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

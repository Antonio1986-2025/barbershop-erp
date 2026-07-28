'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { getToken, getRefreshToken, clearToken, setToken, setRefreshToken, loginRequest, logoutRequest, meRequest } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';

function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return `http://${window.location.hostname}:3001`;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  companyName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast: showToast } = useToast();

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Try refresh
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const refreshRes = await fetch(`/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const { accessToken, refreshToken: newRefresh } = await refreshRes.json();
            setToken(accessToken);
            setRefreshToken(newRefresh);
            const meRes = await fetch(`/api/auth/me`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (meRes.ok) {
              setUser(await meRes.json());
            }
          } else {
                        clearToken();
                        setUser(null);
                      }
        } else {
                      clearToken();
                      setUser(null);
                    }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erro ao fazer login' }));
      throw new Error(error.message);
    }

    const data = await res.json();
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    showToast?.('SUCCESS', 'Login realizado com sucesso!');
  };

  const logout = async () => {
    try {
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {
      // ignore
    }
    clearToken();
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

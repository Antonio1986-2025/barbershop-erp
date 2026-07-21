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
  refreshRequest,
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
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await logoutRequest();
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

  useEffect(() => {
    const token = getToken();
    if (!token) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setLoading(false);
        return;
      }
      refreshRequest()
        .then((data) => {
          if (data) {
            setToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            return meRequest(data.accessToken);
          }
          return null;
        })
        .then((data) => {
          if (data) {
            setUser(data);
          } else {
            clearToken();
          }
        })
        .catch(() => {
          clearToken();
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    meRequest(token)
      .then((data) => {
        if (data) {
          setUser(data);
        } else {
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            refreshRequest()
              .then((r) => {
                if (r) {
                  setToken(r.accessToken);
                  setRefreshToken(r.refreshToken);
                  return meRequest(r.accessToken);
                }
                return null;
              })
              .then((d) => {
                if (d) setUser(d);
                else clearToken();
              });
          } else {
            clearToken();
          }
        }
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return `http://${window.location.hostname}:3001`;
}

type HealthResponse = {
  status: string;
  service: string;
};

export default function Home() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch(`${getApiBase()}/health`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="animate-fade-in text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4 shadow-lg">
          <span className="text-3xl">💈</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Barbershop ERP</h1>
        <p className="mt-2 text-muted-foreground">
          Sistema de gestão para barbearias
        </p>
      </div>

      {user && (
        <div className="flex flex-col items-center gap-4 sm:flex-row animate-fade-in">
          <span className="text-sm text-muted-foreground">
            {user.name} — {user.companyName}
          </span>
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-light transition-colors"
            >
              Dashboard
            </a>
            <button
              onClick={logout}
              className="rounded-md border border-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      {!user && (
        <a
          href="/login"
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light transition-colors animate-fade-in"
        >
          Entrar
        </a>
      )}

      <div className="w-full max-w-sm rounded-xl border border-border bg-card-bg p-6 text-center shadow-sm animate-fade-in">
        <h2 className="text-base font-semibold text-foreground">API Status</h2>
        {data ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Status:{' '}
              <span className="font-medium text-success">{data.status}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Service: <span className="font-medium text-foreground">{data.service}</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">Conectando...</p>
        )}
      </div>
    </div>
  );
}

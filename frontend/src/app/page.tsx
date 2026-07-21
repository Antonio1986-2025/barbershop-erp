'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

type HealthResponse = {
  status: string;
  service: string;
};

export default function Home() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold">Barbershop ERP</h1>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">
            {user.name} — {user.companyName}
          </span>
          <Link
            href="/dashboard"
            className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700"
          >
            Dashboard
          </Link>
          <button
            onClick={logout}
            className="rounded border px-3 py-1 text-sm hover:bg-zinc-100"
          >
            Sair
          </button>
        </div>
      )}

      {!user && (
        <Link
          href="/login"
          className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
        >
          Entrar
        </Link>
      )}

      <div className="rounded-lg border p-6 text-center">
        <h2 className="text-lg font-semibold">API Status</h2>
        {data ? (
          <div className="mt-4 space-y-2">
            <p>
              Status:{' '}
              <span className="font-medium text-green-600">{data.status}</span>
            </p>
            <p>
              Service: <span className="font-medium">{data.service}</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-zinc-500">Conectando...</p>
        )}
      </div>
    </div>
  );
}

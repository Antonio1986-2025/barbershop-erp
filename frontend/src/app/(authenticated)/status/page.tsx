'use client';

import { useCallback, useEffect, useState } from 'react';

function getApiBase(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return process.env.NEXT_PUBLIC_API_URL ?? `http://${window.location.hostname}:3001`;
}

type Health = {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
};

export default function StatusPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${getApiBase()}/health`);
      if (!res.ok) throw new Error(await res.text());
      setHealth(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Status do Sistema</h1>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          Erro: {error}
        </div>
      )}

      {health && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-card-bg border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${health.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                Status: <span className="font-normal capitalize">{health.status}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card-bg border border-border">
              <p className="text-sm text-muted-foreground">Versão</p>
              <p className="font-mono">{health.version}</p>
            </div>
            <div className="p-4 rounded-lg bg-card-bg border border-border">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="font-mono">{Math.floor(health.uptime / 60)} min</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-card-bg border border-border">
            <p className="text-sm text-muted-foreground">Timestamp</p>
            <p className="font-mono">{new Date(health.timestamp).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      )}

      <button
        onClick={load}
        disabled={error !== ''}
        className="mt-4 w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary-light transition-colors disabled:opacity-50"
      >
        Atualizar
      </button>
    </div>
  );
}
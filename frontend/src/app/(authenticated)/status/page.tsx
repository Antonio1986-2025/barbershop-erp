'use client';

import { useCallback, useEffect, useState } from 'react';

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/health`,
      );
      if (!res.ok) throw new Error(await res.text());
      setHealth(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Status do Sistema</h1>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {health && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-zinc-500">Status</p>
              <p className={`mt-1 text-lg font-bold ${health.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {health.status === 'ok' ? 'Operacional' : 'Indisponível'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-zinc-500">Versão</p>
              <p className="mt-1 text-lg font-bold">{health.version}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-zinc-500">Tempo de Atividade</p>
              <p className="mt-1 text-lg font-bold">{formatUptime(health.uptime)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-zinc-500">Última Verificação</p>
              <p className="mt-1 text-lg font-bold">
                {new Date(health.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-2 text-lg font-semibold">Resposta Completa</h2>
            <pre className="overflow-x-auto rounded bg-zinc-50 p-4 text-xs text-zinc-700">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>

          <button
            onClick={load}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Atualizar
          </button>
        </>
      )}
    </div>
  );
}

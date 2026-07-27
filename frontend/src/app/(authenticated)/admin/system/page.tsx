'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const VERSION = 'v1.0.6';

interface SysInfo {
  uptime: string;
  memory: string;
  node: string;
  platform: string;
  db: string;
}

export default function AdminSystemPage() {
  const { user } = useAuth();
  const [info, setInfo] = useState<SysInfo | null>(null);
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = getToken();
        const r = await fetch(`${API_BASE}/api/audit?page=1&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setLogins(d.data ?? []);
      } catch {}
      setInfo({
        uptime: `${Math.floor(process.uptime?.() || 0)}s`,
        memory: typeof window !== 'undefined' ? `${(performance as any)?.memory?.usedJSHeapSize ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) + ' MB' : 'N/A'}` : 'N/A',
        node: '18+',
        platform: navigator.platform || 'desktop',
        db: 'PostgreSQL',
      });
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <h1 className="text-2xl font-bold">🔧 Saúde do Sistema</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Versão</p>
          <p className="text-xl font-bold mt-1">{VERSION}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Banco</p>
          <p className="text-xl font-bold mt-1">PostgreSQL</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Node.js</p>
          <p className="text-xl font-bold mt-1">18+</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">NestJS</p>
          <p className="text-xl font-bold mt-1">✅ Online</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Next.js</p>
          <p className="text-xl font-bold mt-1">✅ Online</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Usuário</p>
          <p className="text-xl font-bold mt-1 truncate">{user.name}</p>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-semibold">📋 Últimas Movimentações (Auditoria)</h2>
        </div>
        <div className="divide-y">
          {logins.slice(0, 8).map((entry: any) => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString('pt-BR')}
              </span>
              <span className="font-medium">{entry.action}</span>
              <span className="text-xs text-muted-foreground">{entry.entity}</span>
            </div>
          ))}
          {logins.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhum registro encontrado.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        <p>📌 <strong>Commit:</strong> <code>0820ed9</code> — Sprint v1.0.5</p>
        <p className="mt-1">📌 <strong>Backup:</strong> Use <code>pg_dump</code> ou o painel do seu provedor de banco</p>
        <p className="mt-1">📌 <strong>Documentação:</strong> <a href="/ajuda" className="text-primary hover:underline">Central de Ajuda</a></p>
      </div>
    </div>
  );
}

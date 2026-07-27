'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { ErrorBox } from '@/components/crud/error-box';
import { Pagination } from '@/components/crud/pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function apiHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function BarberSalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('barber')) { router.replace('/dashboard'); return; }
    load();
  }, [user, page, filter]);

  async function load() {
    setLoading(true);
    try {
      const url = filter
        ? `${API_BASE}/api/barber/sales?page=${page}&status=${filter}`
        : `${API_BASE}/api/barber/sales?page=${page}`;
      const r = await fetch(url, { headers: apiHeaders() });
      const d = await r.json();
      setData(d.data ?? []);
      setMeta(d.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600', OPEN: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-600',
  };

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Minhas Vendas</h1>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border bg-card-bg px-3 py-1.5 text-sm">
          <option value="">Todas</option>
          <option value="PAID">Pagas</option>
          <option value="DRAFT">Rascunho</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      {data.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">Nenhuma venda encontrada.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Total</th>
                <th className="p-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s: any) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{s.customer?.name ?? '-'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[s.status] ?? ''}`}>{s.status}</span>
                  </td>
                  <td className="p-3 text-right">R$ {Number(s.total).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ErrorBox } from '@/components/crud/error-box';
import { Pagination } from '@/components/crud/pagination';

export default function ServiceOrdersPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/service-orders?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setData(d.data ?? []);
      setMeta(d.meta ?? { page, limit: 10, total: 0, totalPages: 0 });
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const statusColors: Record<string,string> = {
    OPEN: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-600',
  };

  if (loading) return <div className="flex justify-center py-12"><p className="animate-pulse text-muted-foreground">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comandas</h1>
      {data.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">Nenhuma comanda encontrada.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="p-3 font-medium">Cliente</th><th className="p-3 font-medium">Profissional</th>
                <th className="p-3 font-medium">Status</th><th className="p-3 font-medium text-right">Total</th>
                <th className="p-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.map((so:any) => (
                <tr key={so.id} className="border-b hover:bg-muted/10">
                  <td className="p-3 font-medium">{so.customer?.name ?? '-'}</td>
                  <td className="p-3">{so.professional?.name ?? '-'}</td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[so.status] ?? ''}`}>{so.status}</span></td>
                  <td className="p-3 text-right font-semibold">R$ {Number(so.total).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(so.createdAt).toLocaleDateString('pt-BR')}</td>
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

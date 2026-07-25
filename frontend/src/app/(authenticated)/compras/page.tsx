'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPurchases, PURCHASE_STATUS_LABELS, PURCHASE_STATUS_COLORS } from '@/lib/purchases';
import type { Purchase } from '@/lib/purchases';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';

export default function ComprasPage() {
  const router = useRouter();
  const [data, setData] = useState<Purchase[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchPurchases({ page, limit: 10, status: filterStatus || undefined })
      .then(r => { setData(r.data); setMeta(r.meta) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);
  useEffect(() => { setPage(1); load() }, [filterStatus]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Compras</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-light transition-colors"
          onClick={() => router.push('/compras/novo')}>Nova Compra</button>
      </div>

      <div className="flex gap-3">
        <select className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(PURCHASE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-muted-foreground animate-pulse">Carregando...</p> : data.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma compra encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Fornecedor</th>
                <th className="px-4 py-2 text-left">Unidade</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(p => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium">{p.supplier.name}</td>
                  <td className="px-4 py-2">{p.unit.name}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PURCHASE_STATUS_COLORS[p.status] ?? ''}`}>
                      {PURCHASE_STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">R$ {Number(p.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-sm text-blue-600 hover:underline"
                      onClick={() => router.push(`/compras/${p.id}`)}>Detalhes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

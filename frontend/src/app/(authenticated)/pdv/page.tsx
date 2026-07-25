'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSales, SALE_STATUS_LABELS, SALE_STATUS_COLORS } from '@/lib/sales';
import type { Sale } from '@/lib/sales';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';

export default function PDVPage() {
  const router = useRouter();
  const [data, setData] = useState<Sale[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchSales({
      page, limit: 20,
      status: filterStatus || undefined,
      startDate: filterStart || undefined,
      endDate: filterEnd || undefined,
    })
      .then(r => { setData(r.data); setMeta(r.meta) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);
  useEffect(() => { setPage(1); load() }, [filterStatus, filterStart, filterEnd]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendas (PDV)</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/pdv/novo')}>Nova Venda</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(SALE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">De</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={filterStart}
            onChange={e => setFilterStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Até</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={filterEnd}
            onChange={e => setFilterEnd(e.target.value)} />
        </div>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-zinc-500">Carregando...</p> : data.length === 0 ? (
        <p className="text-zinc-500">Nenhuma venda encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Cliente</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
                <th className="px-4 py-2 text-left font-medium">Data</th>
                <th className="px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(sale => (
                <tr key={sale.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium">{sale.customer?.name ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SALE_STATUS_COLORS[sale.status] ?? ''}`}>
                      {SALE_STATUS_LABELS[sale.status] ?? sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">R$ {Number(sale.total).toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(sale.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-sm text-blue-600 hover:underline"
                      onClick={() => router.push(`/pdv/${sale.id}`)}>Detalhes</button>
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

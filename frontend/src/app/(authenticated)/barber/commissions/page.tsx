'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { fetchCommissions, type Commission } from '@/lib/commission';
import { ErrorBox } from '@/components/crud/error-box';
import { Pagination } from '@/components/crud/pagination';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  PAID: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function BarberCommissionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Commission[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('barber')) { router.replace('/dashboard'); return; }
    load();
  }, [user, page, statusFilter]);

  function load() {
    setLoading(true);
    setError('');
    fetchCommissions({ page, status: statusFilter || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  const summary = {
    total: data.reduce((s, c) => s + Number(c.commissionAmount), 0),
    pending: data.filter((c) => c.status === 'PENDING').reduce((s, c) => s + Number(c.commissionAmount), 0),
    approved: data.filter((c) => c.status === 'APPROVED').reduce((s, c) => s + Number(c.commissionAmount), 0),
    paid: data.filter((c) => c.status === 'PAID').reduce((s, c) => s + Number(c.commissionAmount), 0),
    rejected: data.filter((c) => c.status === 'REJECTED').reduce((s, c) => s + Number(c.commissionAmount), 0),
  };

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold sm:text-2xl">Minhas Comissões</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard label="Total" value={summary.total} color="blue" />
        <SummaryCard label="Pendente" value={summary.pending} color="yellow" />
        <SummaryCard label="Aprovada" value={summary.approved} color="green" />
        <SummaryCard label="Paga" value={summary.paid} color="blue" />
        <SummaryCard label="Rejeitada" value={summary.rejected} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border bg-card-bg px-3 py-1.5 text-sm">
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="APPROVED">Aprovada</option>
          <option value="PAID">Paga</option>
          <option value="REJECTED">Rejeitada</option>
        </select>
      </div>

      {/* Commissions List */}
      {data.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">Nenhuma comissão encontrada.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="p-3 font-medium">Data</th>
                <th className="p-3 font-medium">Valor Venda</th>
                <th className="p-3 font-medium">Percentual</th>
                <th className="p-3 font-medium">Comissão</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-3">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">R$ {Number(c.totalServiceAmount || c.totalProductAmount || 0).toFixed(2)}</td>
                  <td className="p-3">{c.rateApplied ?? '-'}%</td>
                  <td className="p-3 font-semibold">R$ {Number(c.commissionAmount).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    gray: 'border-gray-200 bg-gray-50 text-gray-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-lg font-bold">R$ {value.toFixed(2)}</p>
    </div>
  );
}

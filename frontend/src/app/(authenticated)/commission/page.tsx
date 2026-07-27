'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ErrorBox } from '@/components/crud/error-box';
import { Pagination } from '@/components/crud/pagination';
import { useToast } from '@/components/ui/toast';
import {
  fetchCommissions,
  approveCommission,
  rejectCommission,
  fetchCommissionClosings,
  closeCommissionPeriod,
  type Commission,
} from '@/lib/commission';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  PAID: 'Paga',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  PAID: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function CommissionAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [data, setData] = useState<Commission[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selected, setSelected] = useState<Commission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Closing modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [closings, setClosings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    load();
    loadClosings();
  }, [user, page, statusFilter]);

  function load() {
    setLoading(true);
    setError('');
    fetchCommissions({ page, status: statusFilter || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function loadClosings() {
    fetchCommissionClosings()
      .then(setClosings)
      .catch(() => {});
  }

  async function handleApprove(id: string) {
    setActionLoading(true);
    try {
      await approveCommission(id);
      addToast('SUCCESS', 'Comissão aprovada');
      load();
    } catch (e: any) {
      addToast('ERROR', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) { addToast('ERROR', 'Motivo da rejeição é obrigatório'); return; }
    setActionLoading(true);
    try {
      await rejectCommission(id, rejectReason);
      addToast('SUCCESS', 'Comissão rejeitada');
      setShowReject(false);
      setRejectReason('');
      setSelected(null);
      load();
    } catch (e: any) {
      addToast('ERROR', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClosePeriod() {
    setActionLoading(true);
    try {
      await closeCommissionPeriod({ unitId: '', periodStart, periodEnd });
      addToast('SUCCESS', 'Período fechado com sucesso');
      setShowCloseModal(false);
      load();
      loadClosings();
    } catch (e: any) {
      addToast('ERROR', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Comissões</h1>
        <button onClick={() => setShowCloseModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-light transition-colors">
          Fechar Período
        </button>
      </div>

      <ErrorBox message={error} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border bg-card-bg px-3 py-1.5 text-sm">
          <option value="PENDING">Pendentes</option>
          <option value="">Todas</option>
          <option value="APPROVED">Aprovadas</option>
          <option value="PAID">Pagas</option>
          <option value="REJECTED">Rejeitadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      {/* Commissions Table */}
      {data.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">Nenhuma comissão encontrada.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="p-3 font-medium">Data</th>
                <th className="p-3 font-medium">Valor</th>
                <th className="p-3 font-medium">%</th>
                <th className="p-3 font-medium">Comissão</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Ações</th>
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
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                    {c.status === 'REJECTED' && c.rejectReason && (
                      <p className="text-xs text-red-500 mt-1">{c.rejectReason}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {c.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(c.id)} disabled={actionLoading}
                            className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                            Aprovar
                          </button>
                          <button onClick={() => { setSelected(c); setShowReject(true); setRejectReason(''); }}
                            className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 transition-colors">
                            Rejeitar
                          </button>
                        </>
                      )}
                      {c.status === 'APPROVED' && (
                        <span className="text-xs text-green-600">Aguardando fechamento</span>
                      )}
                      {c.status === 'PAID' && (
                        <span className="text-xs text-blue-600">Paga</span>
                      )}
                      {c.status === 'REJECTED' && (
                        <span className="text-xs text-red-500">Rejeitada</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}

      {/* Reject Modal */}
      {showReject && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowReject(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Rejeitar Comissão</h3>
            <p className="mt-1 text-sm text-muted-foreground">R$ {Number(selected.commissionAmount).toFixed(2)}</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição (obrigatório)"
              className="mt-4 w-full rounded-md border border-border p-3 text-sm min-h-[80px]" />
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => setShowReject(false)} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => handleReject(selected.id)} disabled={actionLoading || !rejectReason.trim()}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {actionLoading ? 'Aguarde...' : 'Rejeitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Period Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCloseModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Fechar Período</h3>
            <p className="mt-1 text-sm text-muted-foreground">Todas as comissões aprovadas serão marcadas como pagas.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full rounded-md border border-border p-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full rounded-md border border-border p-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => setShowCloseModal(false)} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
              <button onClick={handleClosePeriod} disabled={actionLoading}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary-light disabled:opacity-50 transition-colors">
                {actionLoading ? 'Fechando...' : 'Fechar Período'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Closings History */}
      {closings.length > 0 && (
        <div className="rounded-lg border border-border">
          <div className="border-b bg-muted/30 px-4 py-2">
            <h2 className="text-sm font-semibold">Fechamentos Realizados</h2>
          </div>
          <div className="divide-y">
            {closings.map((cl: any) => (
              <div key={cl.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(cl.periodStart).toLocaleDateString('pt-BR')} — {new Date(cl.periodEnd).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cl.totalCommissions} comissões · {cl.totalBarbers} barbeiros
                  </p>
                </div>
                <p className="text-sm font-semibold">R$ {Number(cl.totalCommissionAmount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

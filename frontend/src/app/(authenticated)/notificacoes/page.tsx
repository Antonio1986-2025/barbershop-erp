'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchNotifications, markNotificationAsRead } from '@/lib/notifications';
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_STATUS_LABELS, NOTIFICATION_STATUS_COLORS } from '@/lib/notifications';
import type { Notification } from '@/lib/notifications';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';

export default function NotificacoesPage() {
  const [data, setData] = useState<Notification[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const [selected, setSelected] = useState<Notification | null>(null);

  function load() {
    setLoading(true); setError('');
    fetchNotifications({
      page, limit: 20,
      status: filterStatus || undefined,
      type: filterType || undefined,
      startDate: filterStart || undefined,
      endDate: filterEnd || undefined,
    })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);
  useEffect(() => { setPage(1); load() }, [filterStatus, filterType, filterStart, filterEnd]);

  async function handleMarkRead(item: Notification) {
    if (item.status === 'READ') return;
    try {
      await markNotificationAsRead(item.id);
      load();
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificações</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Tipo</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(NOTIFICATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(NOTIFICATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
        <p className="text-zinc-500">Nenhuma notificação encontrada.</p>
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.id}
              className={`cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50 ${
                item.status !== 'READ' ? 'border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => { handleMarkRead(item); setSelected(item === selected ? null : item) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${NOTIFICATION_STATUS_COLORS[item.status] ?? ''}`}>
                      {NOTIFICATION_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{item.message}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                    <span>{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                    <span>{NOTIFICATION_TYPE_LABELS[item.type] ?? item.type}</span>
                    {item.customer && <span>Cliente: {item.customer.name}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

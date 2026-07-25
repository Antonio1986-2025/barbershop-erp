'use client';

import { useEffect, useState } from 'react';
import { fetchAlerts, resolveAlert, checkAlerts, ALERT_TYPE_LABELS, ALERT_TYPE_COLORS } from '@/lib/stock-alerts';
import type { StockAlert } from '@/lib/stock-alerts';
import { fetchUnits } from '@/lib/units';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { Unit } from '@/lib/units';

export default function AlertasPage() {
  const [data, setData] = useState<StockAlert[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterResolved, setFilterResolved] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchAlerts({
      page, limit: 20,
      type: filterType || undefined,
      unitId: filterUnit || undefined,
      ...(filterResolved !== '' ? { resolved: filterResolved === 'true' } : {}),
    }).then(r => { setData(r.data); setMeta(r.meta) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);
  useEffect(() => { setPage(1); load() }, [filterType, filterUnit, filterResolved]);
  useEffect(() => { fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {}) }, []);

  async function handleResolve(id: string) {
    setActionLoading(true); setError('');
    try { await resolveAlert(id); load() }
    catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  async function handleCheckAlerts() {
    setActionLoading(true); setError('');
    try {
      const r = await checkAlerts();
      alert(`Alertas criados: ${r.alertsCreated}\nAlertas resolvidos: ${r.alertsResolved}`);
      load();
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Alertas de Estoque</h1>
          <p className="text-sm text-zinc-500"><a href="/estoque" className="hover:underline">Estoque</a> / Alertas</p>
        </div>
        <button className="rounded border px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
          disabled={actionLoading} onClick={handleCheckAlerts}>
          {actionLoading ? 'Verificando...' : 'Verificar Alertas'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="rounded border px-3 py-1.5 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(ALERT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="rounded border px-3 py-1.5 text-sm" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
          <option value="">Todas unidades</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="rounded border px-3 py-1.5 text-sm" value={filterResolved} onChange={e => setFilterResolved(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="false">Abertos</option>
          <option value="true">Resolvidos</option>
        </select>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-muted-foreground animate-pulse">Carregando...</p> : data.length === 0 ? (
        <p className="text-muted-foreground">Nenhum alerta encontrado.</p>
      ) : (
        <div className="space-y-2">
          {data.map(a => (
            <div key={a.id} className={`rounded-lg border p-4 ${a.resolved ? 'bg-zinc-50' : 'bg-white shadow-sm'}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ALERT_TYPE_COLORS[a.type] ?? ''}`}>
                      {ALERT_TYPE_LABELS[a.type] ?? a.type}
                    </span>
                    <span className="text-xs text-zinc-500">{a.unit?.name}</span>
                  </div>
                  <p className="text-sm font-medium">{a.product?.name}</p>
                  <p className="text-xs text-zinc-600">{a.message}</p>
                  {a.details && <p className="text-xs text-zinc-400">{a.details}</p>}
                  <p className="text-xs text-zinc-400">{new Date(a.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                  {!a.resolved && (
                    <button className="rounded bg-green-50 px-3 py-1 text-xs text-green-700 hover:bg-green-100"
                      onClick={() => handleResolve(a.id)} disabled={actionLoading}>
                      Resolver
                    </button>
                  )}
                  {a.resolved && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Resolvido</span>
                  )}
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

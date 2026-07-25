'use client';

import { useEffect, useState } from 'react';
import { fetchCurrentStock, fetchLowStock } from '@/lib/stock';
import { fetchUnits } from '@/lib/units';
import { ErrorBox } from '@/components/crud/error-box';
import type { Unit } from '@/lib/units';

export default function RelatoriosPage() {
  const [tab, setTab] = useState<'current' | 'low'>('current');
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    const params = { unitId: selectedUnit || undefined };
    if (tab === 'current') {
      fetchCurrentStock(params).then(r => { setData(r.data); setTotalValue(r.totalValue) })
        .catch(e => setError(e.message)).finally(() => setLoading(false));
    } else {
      fetchLowStock(params).then(r => { setData(r.data) })
        .catch(e => setError(e.message)).finally(() => setLoading(false));
    }
  }

  useEffect(() => { load() }, [tab, selectedUnit]);
  useEffect(() => { fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {}) }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios de Estoque</h1>
        <p className="text-sm text-muted-foreground"><a href="/estoque" className="hover:underline">Estoque</a> / Relatórios</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border p-1">
          <button className={`rounded px-3 py-1 text-sm ${tab === 'current' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            onClick={() => setTab('current')}>Estoque Atual</button>
          <button className={`rounded px-3 py-1 text-sm ${tab === 'low' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            onClick={() => setTab('low')}>Estoque Baixo</button>
        </div>
        <select className="rounded border px-3 py-1.5 text-sm" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
          <option value="">Todas unidades</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-muted-foreground animate-pulse">Carregando...</p> : data.length === 0 ? (
        <p className="text-muted-foreground">Nenhum dado encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left">Produto</th>
                <th className="px-4 py-2 text-left">Código</th>
                <th className="px-4 py-2 text-left">Unidade</th>
                <th className="px-4 py-2 text-right">Quantidade</th>
                {tab === 'current' && <th className="px-4 py-2 text-right">Custo Médio</th>}
                {tab === 'current' && <th className="px-4 py-2 text-right">Valor Total</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted">
                  <td className="px-4 py-2 font-medium">{row.productName}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{row.barcode ?? '—'}</td>
                  <td className="px-4 py-2">{row.unitName}</td>
                  <td className="px-4 py-2 text-right font-medium">{row.quantity}</td>
                  {tab === 'current' && <td className="px-4 py-2 text-right">R$ {Number(row.avgCost).toFixed(2)}</td>}
                  {tab === 'current' && <td className="px-4 py-2 text-right font-medium">R$ {Number(row.totalValue).toFixed(2)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'current' && totalValue > 0 && (
        <div className="text-right text-sm text-zinc-600">
          Valor total em estoque: <strong>R$ {totalValue.toFixed(2)}</strong> &nbsp;|&nbsp; Itens: <strong>{data.length}</strong>
        </div>
      )}
    </div>
  );
}

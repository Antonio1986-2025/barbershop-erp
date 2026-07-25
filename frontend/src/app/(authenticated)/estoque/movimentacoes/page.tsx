'use client';

import { useEffect, useState } from 'react';
import { fetchMovements, adjustStock, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/lib/stock';
import { fetchProducts } from '@/lib/products';
import { fetchUnits } from '@/lib/units';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { StockMovement } from '@/lib/stock';
import type { Product } from '@/lib/products';
import type { Unit } from '@/lib/units';

export default function MovimentacoesPage() {
  const [data, setData] = useState<StockMovement[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterType, setFilterType] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustUnit, setAdjustUnit] = useState('');
  const [adjustProductSearch, setAdjustProductSearch] = useState('');
  const [adjustProducts, setAdjustProducts] = useState<Product[]>([]);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustCost, setAdjustCost] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  function load() {
    setLoading(true); setError('');
    fetchMovements({
      page, limit: 20,
      type: filterType || undefined,
      unitId: filterUnit || undefined,
      startDate: filterStart || undefined,
      endDate: filterEnd || undefined,
    }).then(r => { setData(r.data); setMeta(r.meta) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);
  useEffect(() => { setPage(1); load() }, [filterType, filterUnit, filterStart, filterEnd]);

  useEffect(() => {
    fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {});
  }, []);

  async function searchProducts(q: string) {
    setAdjustProductSearch(q);
    if (q.length < 1) { setAdjustProducts([]); return }
    try {
      const r = await fetchProducts({ search: q, limit: 10, active: 'true' });
      setAdjustProducts(r.data);
    } catch { setAdjustProducts([]) }
  }

  async function handleAdjust() {
    if (!adjustProduct || !adjustQty || !adjustUnit) { setError('Preencha todos os campos'); return }
    setAdjusting(true); setError('');
    try {
      await adjustStock({
        unitId: adjustUnit,
        productId: adjustProduct.id,
        quantity: parseFloat(adjustQty),
        unitCost: adjustCost ? parseFloat(adjustCost) : undefined,
        description: adjustDesc || undefined,
      });
      setShowAdjust(false);
      setAdjustProduct(null);
      setAdjustQty('');
      setAdjustCost('');
      setAdjustDesc('');
      load();
    } catch (e: any) { setError(e.message) }
    finally { setAdjusting(false) }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimentações</h1>
          <p className="text-sm text-muted-foreground"><a href="/estoque" className="hover:underline">Estoque</a> / Movimentações</p>
        </div>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => { setShowAdjust(true); setError('') }}>Ajustar Estoque</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="rounded border px-3 py-1.5 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="rounded border px-3 py-1.5 text-sm" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
          <option value="">Todas unidades</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="date" className="rounded border px-3 py-1.5 text-sm" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
        <input type="date" className="rounded border px-3 py-1.5 text-sm" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-muted-foreground animate-pulse">Carregando...</p> : data.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma movimentação encontrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Produto</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Unidade</th>
                <th className="px-4 py-2 text-right">Qtd</th>
                <th className="px-4 py-2 text-right">Saldo</th>
                <th className="px-4 py-2 text-left">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(m => (
                <tr key={m.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2 font-medium">{m.product.name}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MOVEMENT_TYPE_COLORS[m.type] ?? ''}`}>
                      {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">{m.unit.name}</td>
                  <td className="px-4 py-2 text-right font-medium">{m.quantity}</td>
                  <td className="px-4 py-2 text-right">{m.balanceAfter}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{m.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />

      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Ajustar Estoque</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Unidade</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={adjustUnit}
                  onChange={e => setAdjustUnit(e.target.value)}>
                  <option value="">Selecione...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Produto</label>
                {adjustProduct ? (
                  <div className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span>{adjustProduct.name}</span>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => { setAdjustProduct(null); setAdjustProductSearch('') }}>Trocar</button>
                  </div>
                ) : (
                  <div>
                    <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Buscar produto..."
                      value={adjustProductSearch} onChange={e => searchProducts(e.target.value)} />
                    {adjustProducts.length > 0 && (
                      <div className="mt-1 max-h-40 overflow-y-auto rounded border bg-white shadow-sm">
                        {adjustProducts.map(p => (
                          <button key={p.id} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
                            onClick={() => { setAdjustProduct(p); setAdjustProducts([]); setAdjustProductSearch('') }}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Quantidade (+ entrada / - saída)</label>
                <input type="number" step="0.001" className="w-full rounded border px-3 py-2 text-sm"
                  value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="Ex: 10 ou -5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Custo Unitário (só para entrada)</label>
                <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-2 text-sm"
                  value={adjustCost} onChange={e => setAdjustCost(e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Descrição</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={adjustDesc}
                  onChange={e => setAdjustDesc(e.target.value)} placeholder="Motivo do ajuste" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowAdjust(false)}>Cancelar</button>
              <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
                disabled={adjusting} onClick={handleAdjust}>
                {adjusting ? 'Ajustando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

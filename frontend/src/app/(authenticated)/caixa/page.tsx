'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchUnits } from '@/lib/units';
import { fetchCurrentCash, fetchCashSummary, openCash, supplyCash, withdrawCash, closeCash, fetchCashHistory } from '@/lib/cash';
import { ErrorBox } from '@/components/crud/error-box';
import type { Unit } from '@/lib/units';
import type { CashSummary, CashHistoryItem, CashTransaction } from '@/lib/cash';

export default function CaixaPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [history, setHistory] = useState<CashHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showOpenForm, setShowOpenForm] = useState(false);
  const [openAmount, setOpenAmount] = useState('0');

  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [supplyAmount, setSupplyAmount] = useState('');
  const [supplyDesc, setSupplyDesc] = useState('');

  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDesc, setWithdrawDesc] = useState('');

  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeExpected, setCloseExpected] = useState('');
  const [closeActual, setCloseActual] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUnits().then(r => {
      const list = r.data ?? r;
      setUnits(list);
      if (list.length === 1) setSelectedUnit(list[0].id);
    }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    if (!selectedUnit) { setSummary(null); setHistory([]); setLoading(false); return }
    setLoading(true); setError('');
    Promise.all([
      fetchCurrentCash(selectedUnit).then(s => setSummary(s)).catch(() => {}),
      fetchCashHistory(selectedUnit).then(setHistory).catch(() => {}),
    ]).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [selectedUnit]);

  useEffect(() => { load() }, [load]);

  function resetAllForms() {
    setShowOpenForm(false); setShowSupplyForm(false); setShowWithdrawForm(false); setShowCloseForm(false);
    setOpenAmount('0'); setSupplyAmount(''); setSupplyDesc('');
    setWithdrawAmount(''); setWithdrawDesc(''); setCloseExpected(''); setCloseActual('');
  }

  async function handleOpen() {
    setActionLoading(true); setError('');
    try {
      await openCash({ unitId: selectedUnit, openingAmount: parseFloat(openAmount) || 0 });
      resetAllForms(); load();
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  async function handleSupply() {
    if (!supplyAmount || !supplyDesc) { setError('Preencha todos os campos'); return }
    if (!summary) return;
    setActionLoading(true); setError('');
    try {
      await supplyCash(summary.id, { amount: parseFloat(supplyAmount), description: supplyDesc });
      resetAllForms(); load();
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  async function handleWithdraw() {
    if (!withdrawAmount || !withdrawDesc) { setError('Preencha todos os campos'); return }
    if (!summary) return;
    setActionLoading(true); setError('');
    try {
      await withdrawCash(summary.id, { amount: parseFloat(withdrawAmount), description: withdrawDesc });
      resetAllForms(); load();
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  async function handleClose() {
    if (!summary) return;
    setActionLoading(true); setError('');
    try {
      await closeCash(summary.id, {
        expectedAmount: closeExpected ? parseFloat(closeExpected) : undefined,
        closingAmount: closeActual ? parseFloat(closeActual) : undefined,
      });
      resetAllForms(); load();
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        h1 className="text-xl font-bold sm:text-2xl"
        <select className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary max-w-[200px]"
          value={selectedUnit} onChange={e => { setSelectedUnit(e.target.value); resetAllForms() }}>
          <option value="">Selecione a unidade</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <ErrorBox message={error} />

      {!selectedUnit && (
        <div className="rounded-lg border-2 border-dashed p-12 text-center text-sm text-zinc-400">
          Selecione uma unidade para gerenciar o caixa
        </div>
      )}

      {loading && selectedUnit && <p className="text-muted-foreground animate-pulse">Carregando...</p>}

      {!loading && summary && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-zinc-500">Abertura</p>
              <p className="text-lg font-bold">R$ {Number(summary.openingAmount).toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-green-500">Entradas</p>
              <p className="text-lg font-bold text-green-600">R$ {Number(summary.entries).toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-red-500">Saídas</p>
              <p className="text-lg font-bold text-red-600">R$ {Number(summary.exits).toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-zinc-500">Saldo Atual</p>
              <p className="text-lg font-bold">R$ {Number(summary.expectedBalance).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              onClick={() => { setShowSupplyForm(true); setError('') }}>Suprimento</button>
            <button className="rounded bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600"
              onClick={() => { setShowWithdrawForm(true); setError('') }}>Sangria</button>
            <button className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              onClick={() => { setShowCloseForm(true); setError(''); setCloseExpected(summary.expectedBalance.toFixed(2)); setCloseActual(summary.expectedBalance.toFixed(2)) }}>
              Fechar Caixa
            </button>
          </div>

          <div className="rounded-lg border">
            <div className="border-b bg-zinc-50 px-4 py-2">
              <h2 className="text-sm font-semibold text-zinc-600">
                Movimentações ({summary.transactionCount})
              </h2>
            </div>
            {summary.transactions.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma movimentação.</p>
            ) : (
              <div className="divide-y">
                {summary.transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm">{t.description}</p>
                      <p className="text-xs text-zinc-500">{new Date(t.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'ENTRY' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !summary && selectedUnit && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-zinc-500 mb-4">Nenhum caixa aberto para esta unidade.</p>
          <button className="rounded bg-zinc-900 px-6 py-2 text-sm text-white hover:bg-zinc-700"
            onClick={() => { setShowOpenForm(true); setError('') }}>
            Abrir Caixa
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b bg-zinc-50 px-4 py-2">
            <h2 className="text-sm font-semibold text-zinc-600">Histórico</h2>
          </div>
          <div className="divide-y text-sm">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm">
                    {new Date(h.openedAt).toLocaleDateString('pt-BR')}
                    {h.closedAt && <> — {new Date(h.closedAt).toLocaleDateString('pt-BR')}</>}
                  </p>
                  <p className="text-xs text-zinc-500">{h.transactionCount} movimentações</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  h.status === 'OPEN' ? 'text-green-600 bg-green-50' : 'text-zinc-600 bg-zinc-100'
                }`}>
                  {h.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showOpenForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Abrir Caixa</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor Inicial (opcional)</label>
                <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-2 text-sm"
                  value={openAmount} onChange={e => setOpenAmount(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowOpenForm(false)}>Cancelar</button>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-light transition-colors disabled:opacity-50"
                disabled={actionLoading} onClick={handleOpen}>
                {actionLoading ? 'Abrindo...' : 'Abrir Caixa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSupplyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Suprimento</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor</label>
                <input type="number" step="0.01" min="0.01" className="w-full rounded border px-3 py-2 text-sm"
                  value={supplyAmount} onChange={e => setSupplyAmount(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Descrição</label>
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Ex: Depósito bancário"
                  value={supplyDesc} onChange={e => setSupplyDesc(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowSupplyForm(false)}>Cancelar</button>
              <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={actionLoading} onClick={handleSupply}>
                {actionLoading ? 'Adicionando...' : 'Adicionar Suprimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Sangria</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor</label>
                <input type="number" step="0.01" min="0.01" className="w-full rounded border px-3 py-2 text-sm"
                  value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Descrição</label>
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Ex: Pagamento fornecedor"
                  value={withdrawDesc} onChange={e => setWithdrawDesc(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowWithdrawForm(false)}>Cancelar</button>
              <button className="rounded bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
                disabled={actionLoading} onClick={handleWithdraw}>
                {actionLoading ? 'Retirando...' : 'Realizar Sangria'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Fechar Caixa</h3>
            <p className="mb-4 text-sm text-zinc-600">Confirme os valores para fechamento.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor Esperado</label>
                <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm"
                  value={closeExpected} onChange={e => setCloseExpected(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor Real em Caixa</label>
                <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm"
                  value={closeActual} onChange={e => setCloseActual(e.target.value)} />
              </div>
              {closeExpected && closeActual && (
                <p className={`text-sm ${parseFloat(closeActual) === parseFloat(closeExpected) ? 'text-green-600' : 'text-red-600'}`}>
                  Diferença: R$ {(parseFloat(closeActual) - parseFloat(closeExpected)).toFixed(2)}
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowCloseForm(false)}>Cancelar</button>
              <button className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                disabled={actionLoading} onClick={handleClose}>
                {actionLoading ? 'Fechando...' : 'Fechar Caixa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

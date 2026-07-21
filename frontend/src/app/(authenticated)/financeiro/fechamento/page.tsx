'use client';

import { useEffect, useState } from 'react';
import { createCashClosing, fetchCashClosings } from '@/lib/finance';
import type { CashClosing } from '@/lib/finance';
import { fetchUnits } from '@/lib/units';
import type { Unit } from '@/lib/units';
import { ErrorBox } from '@/components/crud/error-box';

export default function FechamentoPage() {
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchCashClosings().then(setClosings).catch(e => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {}) }, []);

  async function handleSave() {
    try {
      if (!cashRegisterId) { setError('Informe o caixa'); return }
      await createCashClosing({
        cashRegisterId,
        expectedAmount: expectedAmount ? Number(expectedAmount) : undefined,
        closingAmount: closingAmount ? Number(closingAmount) : undefined,
      });
      setShowForm(false); setCashRegisterId(''); setExpectedAmount(''); setClosingAmount(''); load();
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fechamento de Caixa</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => setShowForm(true)}>Novo Fechamento</button>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-zinc-500">Carregando...</p> : closings.length === 0 ? (
        <p className="text-zinc-500">Nenhum fechamento registrado.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Unidade</th>
                <th className="px-4 py-2 text-left font-medium">Abertura</th>
                <th className="px-4 py-2 text-left font-medium">Fechamento</th>
                <th className="px-4 py-2 text-right font-medium">Esperado</th>
                <th className="px-4 py-2 text-right font-medium">Informado</th>
                <th className="px-4 py-2 text-right font-medium">Diferença</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {closings.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2">{item.unit.name}</td>
                  <td className="px-4 py-2">{new Date(item.openedAt).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2">{item.closedAt ? new Date(item.closedAt).toLocaleString('pt-BR') : '-'}</td>
                  <td className="px-4 py-2 text-right">R$ {Number(item.expectedAmount ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">R$ {Number(item.closingAmount ?? 0).toFixed(2)}</td>
                  <td className={`px-4 py-2 text-right font-medium ${Number(item.difference ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {Number(item.difference ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Novo Fechamento</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">ID do Caixa</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={cashRegisterId}
                  onChange={e => setCashRegisterId(e.target.value)} placeholder="ID do caixa" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor Esperado (opcional)</label>
                <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" value={expectedAmount}
                  onChange={e => setExpectedAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor Informado (opcional)</label>
                <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" value={closingAmount}
                  onChange={e => setClosingAmount(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700" onClick={handleSave}>Fechar Caixa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

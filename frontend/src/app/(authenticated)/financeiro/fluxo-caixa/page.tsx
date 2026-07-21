'use client';

import { useEffect, useState } from 'react';
import { fetchCashFlow } from '@/lib/finance';
import type { CashFlow } from '@/lib/finance';
import { ErrorBox } from '@/components/crud/error-box';

export default function FluxoCaixaPage() {
  const [data, setData] = useState<CashFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  function load() {
    setLoading(true); setError('');
    fetchCashFlow({ startDate: startDate || undefined, endDate: endDate || undefined })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [startDate, endDate]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">De</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={startDate}
            onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Até</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={endDate}
            onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-zinc-500">Carregando...</p> : !data ? null : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-green-50 p-4">
              <p className="text-sm text-green-700 font-medium">Entradas</p>
              <p className="text-2xl font-bold text-green-800">R$ {data.cashFlow.in.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-red-50 p-4">
              <p className="text-sm text-red-700 font-medium">Saídas</p>
              <p className="text-2xl font-bold text-red-800">R$ {data.cashFlow.out.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-blue-50 p-4">
              <p className="text-sm text-blue-700 font-medium">Saldo</p>
              <p className={`text-2xl font-bold ${data.cashFlow.balance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                R$ {data.cashFlow.balance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Contas a Receber</h3>
              <div className="space-y-1 text-sm">
                <p>Total: <strong>R$ {data.income.total.toFixed(2)}</strong></p>
                <p className="text-green-600">Pago: R$ {data.income.paid.toFixed(2)}</p>
                <p className="text-yellow-600">Pendente: R$ {data.income.pending.toFixed(2)}</p>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Contas a Pagar</h3>
              <div className="space-y-1 text-sm">
                <p>Total: <strong>R$ {data.expense.total.toFixed(2)}</strong></p>
                <p className="text-green-600">Pago: R$ {data.expense.paid.toFixed(2)}</p>
                <p className="text-yellow-600">Pendente: R$ {data.expense.pending.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Resumo Financeiro</h3>
            <div className="space-y-1 text-sm">
              <p>Saldo Esperado: <strong>R$ {data.balance.expected.toFixed(2)}</strong></p>
              <p>Saldo Realizado: <strong>R$ {data.balance.realized.toFixed(2)}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

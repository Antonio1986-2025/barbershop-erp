'use client';

import { useEffect, useState } from 'react';
import { fetchAccounts, createAccount, updateAccount, payAccount, cancelAccount } from '@/lib/finance';
import { fetchCategories } from '@/lib/finance';
import { ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_COLORS } from '@/lib/finance';
import type { FinancialAccount, FinancialCategory } from '@/lib/finance';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';

export default function ContasPage() {
  const [data, setData] = useState<FinancialAccount[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formCat, setFormCat] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('PAYABLE');
  const [formAmount, setFormAmount] = useState('');
  const [formDue, setFormDue] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchAccounts({
      page, limit: 20,
      type: filterType || undefined,
      status: filterStatus || undefined,
      categoryId: filterCat || undefined,
    })
      .then(r => { setData(r.data); setMeta(r.meta) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);
  useEffect(() => { setPage(1); load() }, [filterType, filterStatus, filterCat]);
  useEffect(() => { fetchCategories().then(setCategories).catch(() => {}) }, []);

  function resetForm() {
    setFormCat(''); setFormDesc(''); setFormType('PAYABLE'); setFormAmount(''); setFormDue(''); setEditing(null);
  }

  async function handleSave() {
    try {
      if (!formCat || !formDesc || !formAmount || !formDue) { setError('Preencha todos os campos'); return }
      const payload = { categoryId: formCat, description: formDesc, type: formType, amount: Number(formAmount), dueDate: new Date(formDue).toISOString() };
      if (editing) {
        await updateAccount(editing, payload as any);
      } else {
        await createAccount(payload);
      }
      setShowForm(false); resetForm(); load();
    } catch (e: any) { setError(e.message) }
  }

  async function handlePay(item: FinancialAccount) {
    if (!confirm(`Pagar conta "${item.description}"?`)) return;
    try { await payAccount(item.id); load() } catch (e: any) { setError(e.message) }
  }

  async function handleCancel(item: FinancialAccount) {
    if (!confirm(`Cancelar conta "${item.description}"?`)) return;
    try { await cancelAccount(item.id); load() } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas Financeiras</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => { resetForm(); setShowForm(true) }}>Nova Conta</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Tipo</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            <option value="RECEIVABLE">A Receber</option>
            <option value="PAYABLE">A Pagar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ACCOUNT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Categoria</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">Todas</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-zinc-500">Carregando...</p> : data.length === 0 ? (
        <p className="text-zinc-500">Nenhuma conta encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Descrição</th>
                <th className="px-4 py-2 text-left font-medium">Tipo</th>
                <th className="px-4 py-2 text-left font-medium">Categoria</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
                <th className="px-4 py-2 text-left font-medium">Vencimento</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium">{item.description}</td>
                  <td className="px-4 py-2">{item.type === 'RECEIVABLE' ? 'A Receber' : 'A Pagar'}</td>
                  <td className="px-4 py-2">{item.category.name}</td>
                  <td className="px-4 py-2 text-right">R$ {Number(item.amount).toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(item.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACCOUNT_STATUS_COLORS[item.status] ?? ''}`}>
                      {ACCOUNT_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="flex justify-end gap-2 px-4 py-2">
                    {item.status === 'OPEN' && (
                      <>
                        <button className="text-xs text-green-600 hover:underline" onClick={() => handlePay(item)}>Pagar</button>
                        <button className="text-xs text-red-600 hover:underline" onClick={() => handleCancel(item)}>Cancelar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editing ? 'Editar' : 'Nova'} Conta</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={formType}
                  onChange={e => setFormType(e.target.value)}>
                  <option value="PAYABLE">A Pagar</option>
                  <option value="RECEIVABLE">A Receber</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={formCat}
                  onChange={e => setFormCat(e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type === 'INCOME' ? 'Receita' : 'Despesa'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={formDesc}
                  onChange={e => setFormDesc(e.target.value)} placeholder="Ex: Aluguel" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor</label>
                <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" value={formAmount}
                  onChange={e => setFormAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
                <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={formDue}
                  onChange={e => setFormDue(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</button>
              <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700" onClick={handleSave}>
                {editing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

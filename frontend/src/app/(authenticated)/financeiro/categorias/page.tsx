'use client';

import { useEffect, useState } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/lib/finance';
import type { FinancialCategory } from '@/lib/finance';
import { ErrorBox } from '@/components/crud/error-box';

export default function CategoriasPage() {
  const [data, setData] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('EXPENSE');

  function load() {
    setLoading(true); setError('');
    fetchCategories().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load() }, []);

  function resetForm() { setFormName(''); setFormType('EXPENSE'); setEditing(null) }

  async function handleSave() {
    try {
      if (!formName) { setError('Informe o nome'); return }
      if (editing) {
        await updateCategory(editing, { name: formName, type: formType });
      } else {
        await createCategory({ name: formName, type: formType });
      }
      setShowForm(false); resetForm(); load();
    } catch (e: any) { setError(e.message) }
  }

  async function handleDelete(item: FinancialCategory) {
    if (!confirm(`Excluir categoria "${item.name}"?`)) return;
    try { await deleteCategory(item.id); load() } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias Financeiras</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => { resetForm(); setShowForm(true) }}>Nova Categoria</button>
      </div>

      <ErrorBox message={error} />

      {loading ? <p className="text-zinc-500">Carregando...</p> : data.length === 0 ? (
        <p className="text-zinc-500">Nenhuma categoria encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nome</th>
                <th className="px-4 py-2 text-left font-medium">Tipo</th>
                <th className="px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2">{item.type === 'INCOME' ? 'Receita' : 'Despesa'}</td>
                  <td className="flex justify-end gap-2 px-4 py-2">
                    <button className="text-xs text-blue-600 hover:underline"
                      onClick={() => { setEditing(item.id); setFormName(item.name); setFormType(item.type); setShowForm(true) }}>Editar</button>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => handleDelete(item)}>Excluir</button>
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
            <h2 className="mb-4 text-lg font-semibold">{editing ? 'Editar' : 'Nova'} Categoria</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={formName}
                  onChange={e => setFormName(e.target.value)} placeholder="Ex: Aluguel" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={formType}
                  onChange={e => setFormType(e.target.value)}>
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
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

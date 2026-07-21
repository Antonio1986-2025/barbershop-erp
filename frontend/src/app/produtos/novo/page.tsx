'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/products';
import { fetchCategories } from '@/lib/categories';
import type { Category } from '@/lib/categories';

export default function NovoProdutoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', barcode: '', categoryId: '', costPrice: '', salePrice: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories({ active: 'true', limit: 100 }).then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    const cost = parseFloat(form.costPrice);
    const sale = parseFloat(form.salePrice);
    if (isNaN(cost) || cost < 0) { setError('Preço de custo inválido'); return; }
    if (isNaN(sale) || sale < 0) { setError('Preço de venda inválido'); return; }

    setSaving(true); setError('');
    try {
      await createProduct({
        name: form.name,
        barcode: form.barcode || undefined,
        categoryId: form.categoryId || undefined,
        costPrice: cost,
        salePrice: sale,
      });
      router.push('/produtos');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Novo Produto</h1>
      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <Field label="Código de Barras">
          <input className="w-full rounded border px-3 py-1.5" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
        </Field>
        <Field label="Categoria">
          <select className="w-full rounded border px-3 py-1.5" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Preço de Custo (R$) *">
            <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-1.5" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} required />
          </Field>
          <Field label="Preço de Venda (R$) *">
            <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-1.5" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} required />
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
            onClick={() => router.push('/produtos')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct } from '@/lib/products';
import { fetchCategories } from '@/lib/categories';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';
import type { Product } from '@/lib/products';
import type { Category } from '@/lib/categories';

interface ProductFormProps {
  initial?: Product;
}

export function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    barcode: initial?.barcode ?? '',
    categoryId: initial?.categoryId ?? '',
    costPrice: String(initial?.costPrice ?? ''),
    salePrice: String(initial?.salePrice ?? ''),
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

    const payload = {
      name: form.name,
      barcode: form.barcode || undefined,
      categoryId: form.categoryId || undefined,
      costPrice: cost,
      salePrice: sale,
    };

    setSaving(true); setError('');
    try {
      if (isEdit) { await updateProduct(initial!.id, payload) }
      else { await createProduct(payload) }
      router.push('/produtos');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </FormField>
        <FormField label="Código de Barras">
          <input className="w-full rounded border px-3 py-1.5" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
        </FormField>
        <FormField label="Categoria">
          <select className="w-full rounded border px-3 py-1.5" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Preço de Custo (R$) *">
            <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-1.5" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} required />
          </FormField>
          <FormField label="Preço de Venda (R$) *">
            <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-1.5" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} required />
          </FormField>
        </div>
        <FormActions backTo="/produtos" saving={saving} />
      </form>
    </div>
  );
}

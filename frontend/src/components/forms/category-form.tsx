'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, updateCategory } from '@/lib/categories';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';
import type { Category } from '@/lib/categories';

interface CategoryFormProps {
  initial?: Category;
}

export function CategoryForm({ initial }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) { await updateCategory(initial!.id, { name, description: description || undefined }) }
      else { await createCategory({ name, description: description || undefined }) }
      router.push('/categorias');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Editar Categoria' : 'Nova Categoria'}</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Descrição">
          <textarea className="w-full rounded border px-3 py-1.5" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormActions backTo="/categorias" saving={saving} />
      </form>
    </div>
  );
}

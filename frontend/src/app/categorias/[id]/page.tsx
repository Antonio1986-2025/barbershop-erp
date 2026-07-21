'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchCategory, updateCategory } from '@/lib/categories';

export default function EditarCategoriaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategory(id)
      .then((c) => { setName(c.name); setDescription(c.description ?? '') })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await updateCategory(id, { name, description: description || undefined });
      router.push('/categorias');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="mx-auto max-w-lg p-6"><p className="text-zinc-500">Carregando...</p></div>;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Editar Categoria</h1>
      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Descrição">
          <textarea className="w-full rounded border px-3 py-1.5" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
            onClick={() => router.push('/categorias')}>Cancelar</button>
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

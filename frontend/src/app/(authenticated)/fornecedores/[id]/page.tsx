'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchSupplier, updateSupplier } from '@/lib/suppliers';
import type { Supplier } from '@/lib/suppliers';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';

export default function EditarFornecedorPage() {
  const params = useParams(); const router = useRouter();
  const id = params.id as string;
  const [initial, setInitial] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier(id).then(setInitial).catch(() => router.push('/fornecedores')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-lg p-6"><p className="text-zinc-500">Carregando...</p></div>;
  if (!initial) return null;

  return <EditForm initial={initial} />;
}

function EditForm({ initial }: { initial: Supplier }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: initial.name, document: initial.document ?? '', email: initial.email ?? '', phone: initial.phone ?? '', contact: initial.contact ?? '', notes: initial.notes ?? '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm(p => ({ ...p, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('');
    try {
      await updateSupplier(initial.id, form);
      router.push('/fornecedores');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Editar Fornecedor</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *"><input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={e => set('name', e.target.value)} required /></FormField>
        <FormField label="Documento"><input className="w-full rounded border px-3 py-1.5" value={form.document} onChange={e => set('document', e.target.value)} /></FormField>
        <FormField label="Contato"><input className="w-full rounded border px-3 py-1.5" value={form.contact} onChange={e => set('contact', e.target.value)} /></FormField>
        <FormField label="Telefone"><input className="w-full rounded border px-3 py-1.5" value={form.phone} onChange={e => set('phone', e.target.value)} /></FormField>
        <FormField label="Email"><input type="email" className="w-full rounded border px-3 py-1.5" value={form.email} onChange={e => set('email', e.target.value)} /></FormField>
        <FormField label="Observações"><textarea className="w-full rounded border px-3 py-1.5" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></FormField>
        <FormActions backTo="/fornecedores" saving={saving} />
      </form>
    </div>
  );
}

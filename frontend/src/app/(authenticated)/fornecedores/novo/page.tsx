'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupplier } from '@/lib/suppliers';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';

export default function NovoFornecedorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', document: '', email: '', phone: '', contact: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm(p => ({ ...p, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('');
    try {
      await createSupplier({
        name: form.name, document: form.document || undefined,
        email: form.email || undefined, phone: form.phone || undefined,
        contact: form.contact || undefined, notes: form.notes || undefined,
      });
      router.push('/fornecedores');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Novo Fornecedor</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *"><input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={e => set('name', e.target.value)} required /></FormField>
        <FormField label="Documento (CPF/CNPJ)"><input className="w-full rounded border px-3 py-1.5" value={form.document} onChange={e => set('document', e.target.value)} /></FormField>
        <FormField label="Contato"><input className="w-full rounded border px-3 py-1.5" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Nome do contato" /></FormField>
        <FormField label="Telefone"><input className="w-full rounded border px-3 py-1.5" value={form.phone} onChange={e => set('phone', e.target.value)} /></FormField>
        <FormField label="Email"><input type="email" className="w-full rounded border px-3 py-1.5" value={form.email} onChange={e => set('email', e.target.value)} /></FormField>
        <FormField label="Observações"><textarea className="w-full rounded border px-3 py-1.5" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></FormField>
        <FormActions backTo="/fornecedores" saving={saving} />
      </form>
    </div>
  );
}

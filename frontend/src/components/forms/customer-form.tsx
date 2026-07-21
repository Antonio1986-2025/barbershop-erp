'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomer, updateCustomer } from '@/lib/customers';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';
import type { Customer } from '@/lib/customers';

interface CustomerFormProps {
  initial?: Customer;
}

export function CustomerForm({ initial }: CustomerFormProps) {
  const router = useRouter();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    document: initial?.document ?? '',
    birthDate: initial?.birthDate ? initial.birthDate.slice(0, 10) : '',
    notes: initial?.notes ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        document: form.document || undefined,
        birthDate: form.birthDate || undefined,
        notes: form.notes || undefined,
      };
      if (isEdit) {
        await updateCustomer(initial!.id, payload);
      } else {
        await createCustomer(payload as any);
      }
      router.push('/clientes');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={form.name}
            onChange={(e) => set('name', e.target.value)} required />
        </FormField>
        <FormField label="Email">
          <input type="email" className="w-full rounded border px-3 py-1.5" value={form.email}
            onChange={(e) => set('email', e.target.value)} />
        </FormField>
        <FormField label="Telefone">
          <input className="w-full rounded border px-3 py-1.5" value={form.phone}
            onChange={(e) => set('phone', e.target.value)} />
        </FormField>
        <FormField label="Documento (CPF/CNPJ)">
          <input className="w-full rounded border px-3 py-1.5" value={form.document}
            onChange={(e) => set('document', e.target.value)} />
        </FormField>
        <FormField label="Data de Nascimento">
          <input type="date" className="w-full rounded border px-3 py-1.5" value={form.birthDate}
            onChange={(e) => set('birthDate', e.target.value)} />
        </FormField>
        <FormField label="Observações">
          <textarea className="w-full rounded border px-3 py-1.5" rows={3} value={form.notes}
            onChange={(e) => set('notes', e.target.value)} />
        </FormField>
        <FormActions backTo="/clientes" saving={saving} />
      </form>
    </div>
  );
}

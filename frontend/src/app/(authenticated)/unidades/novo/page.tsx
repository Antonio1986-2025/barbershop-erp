'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUnit } from '@/lib/units';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';

export default function NovaUnidadePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', code: '', document: '', phone: '', email: '',
    address: '', number: '', complement: '', neighborhood: '',
    city: '', state: '', zipCode: '', status: 'ACTIVE',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    if (!form.code.trim()) { setError('Código é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      for (const k of Object.keys(payload)) {
        if (!(payload as any)[k]) (payload as any)[k] = undefined;
      }
      await createUnit(payload);
      router.push('/unidades');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Nova Unidade</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nome *">
            <input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </FormField>
          <FormField label="Código *">
            <input className="w-full rounded border px-3 py-1.5" value={form.code} onChange={(e) => set('code', e.target.value)} required />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Documento">
            <input className="w-full rounded border px-3 py-1.5" value={form.document} onChange={(e) => set('document', e.target.value)} />
          </FormField>
          <FormField label="Telefone">
            <input className="w-full rounded border px-3 py-1.5" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Email">
          <input type="email" className="w-full rounded border px-3 py-1.5" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </FormField>
        <FormField label="Endereço">
          <input className="w-full rounded border px-3 py-1.5" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Número">
            <input className="w-full rounded border px-3 py-1.5" value={form.number} onChange={(e) => set('number', e.target.value)} />
          </FormField>
          <FormField label="Complemento">
            <input className="w-full rounded border px-3 py-1.5" value={form.complement} onChange={(e) => set('complement', e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Bairro">
            <input className="w-full rounded border px-3 py-1.5" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
          </FormField>
          <FormField label="CEP">
            <input className="w-full rounded border px-3 py-1.5" value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cidade">
            <input className="w-full rounded border px-3 py-1.5" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </FormField>
          <FormField label="UF">
            <input className="w-full rounded border px-3 py-1.5" maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Status">
          <select className="w-full rounded border px-3 py-1.5" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="SUSPENDED">Suspenso</option>
          </select>
        </FormField>
        <FormActions backTo="/unidades" saving={saving} />
      </form>
    </div>
  );
}

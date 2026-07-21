'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createService, updateService } from '@/lib/services';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';
import type { Service } from '@/lib/services';

interface ServiceFormProps {
  initial?: Service;
}

export function ServiceForm({ initial }: ServiceFormProps) {
  const router = useRouter();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    durationMinutes: String(initial?.durationMinutes ?? '30'),
    price: String(initial?.price ?? ''),
    commissionType: initial?.commissionType ?? '',
    commissionValue: initial?.commissionValue != null ? String(initial.commissionValue) : '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    const duration = parseInt(form.durationMinutes, 10);
    if (isNaN(duration) || duration < 1) { setError('Duração deve ser maior que 0'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError('Preço inválido'); return; }

    const payload: any = { name: form.name, description: form.description || undefined, durationMinutes: duration, price };
    if (form.commissionType) payload.commissionType = form.commissionType;
    if (form.commissionValue) {
      const cv = parseFloat(form.commissionValue);
      if (isNaN(cv) || cv < 0 || (form.commissionType === 'PERCENTAGE' && cv > 100)) {
        setError('Valor de comissão inválido'); return;
      }
      payload.commissionValue = cv;
    }

    setSaving(true); setError('');
    try {
      if (isEdit) { await updateService(initial!.id, payload) }
      else { await createService(payload) }
      router.push('/servicos');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Editar Serviço' : 'Novo Serviço'}</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </FormField>
        <FormField label="Descrição">
          <textarea className="w-full rounded border px-3 py-1.5" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Duração (minutos) *">
            <input type="number" min="1" className="w-full rounded border px-3 py-1.5" value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} required />
          </FormField>
          <FormField label="Preço (R$) *">
            <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-1.5" value={form.price} onChange={(e) => set('price', e.target.value)} required />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tipo de Comissão">
            <select className="w-full rounded border px-3 py-1.5" value={form.commissionType} onChange={(e) => set('commissionType', e.target.value)}>
              <option value="">Sem comissão</option>
              <option value="PERCENTAGE">Percentual</option>
              <option value="FIXED">Valor fixo</option>
            </select>
          </FormField>
          <FormField label={form.commissionType === 'PERCENTAGE' ? 'Comissão (%)' : 'Comissão (R$)'}>
            <input type="number" step="0.01" min="0" max={form.commissionType === 'PERCENTAGE' ? '100' : undefined}
              className="w-full rounded border px-3 py-1.5" value={form.commissionValue} onChange={(e) => set('commissionValue', e.target.value)} />
          </FormField>
        </div>
        <FormActions backTo="/servicos" saving={saving} />
      </form>
    </div>
  );
}

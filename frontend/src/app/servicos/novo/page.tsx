'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createService } from '@/lib/services';

export default function NovoServicoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMinutes: '30',
    price: '',
    commissionType: '',
    commissionValue: '',
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

    const payload: any = {
      name: form.name,
      description: form.description || undefined,
      durationMinutes: duration,
      price,
    };
    if (form.commissionType) payload.commissionType = form.commissionType;
    if (form.commissionValue) {
      const cv = parseFloat(form.commissionValue);
      if (isNaN(cv) || cv < 0 || (form.commissionType === 'PERCENTAGE' && cv > 100)) {
        setError('Valor de comissão inválido');
        return;
      }
      payload.commissionValue = cv;
    }

    setSaving(true);
    setError('');
    try {
      await createService(payload);
      router.push('/servicos');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Novo Serviço</h1>
      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <Field label="Descrição">
          <textarea className="w-full rounded border px-3 py-1.5" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duração (minutos) *">
            <input type="number" min="1" className="w-full rounded border px-3 py-1.5" value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} required />
          </Field>
          <Field label="Preço (R$) *">
            <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-1.5" value={form.price} onChange={(e) => set('price', e.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de Comissão">
            <select className="w-full rounded border px-3 py-1.5" value={form.commissionType} onChange={(e) => set('commissionType', e.target.value)}>
              <option value="">Sem comissão</option>
              <option value="PERCENTAGE">Percentual</option>
              <option value="FIXED">Valor fixo</option>
            </select>
          </Field>
          <Field label={form.commissionType === 'PERCENTAGE' ? 'Comissão (%)' : 'Comissão (R$)'}>
            <input type="number" step="0.01" min="0" max={form.commissionType === 'PERCENTAGE' ? '100' : undefined}
              className="w-full rounded border px-3 py-1.5" value={form.commissionValue} onChange={(e) => set('commissionValue', e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="rounded border px-4 py-2 text-sm hover:bg-zinc-50" onClick={() => router.push('/servicos')}>
            Cancelar
          </button>
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

'use client';

import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '@/lib/company-settings';
import { ErrorBox } from '@/components/crud/error-box';
import type { CompanySettings } from '@/lib/company-settings';

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function set(field: string, value: any) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
          if (k !== 'id' && k !== 'companyId' && k !== 'createdAt' && k !== 'updatedAt') {
            clean[k] = v ?? '';
          }
        }
        setForm(clean);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload: Record<string, any> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v === '' || v === null) continue;
        if (k === 'allowOnlineScheduling') {
          payload[k] = v === true || v === 'true';
        } else if (k === 'defaultAppointmentDuration' || k === 'cancellationLimitHours') {
          const n = Number(v);
          if (!isNaN(n)) payload[k] = n;
        } else {
          payload[k] = v;
        }
      }
      await updateSettings(payload);
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="mx-auto max-w-3xl p-6"><p className="text-zinc-500">Carregando...</p></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Configurações da Empresa</h1>

      <ErrorBox message={error} />
      {success && <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title="Identidade">
          <Field label="URL do Logo">
            <input className="w-full rounded border px-3 py-1.5" value={form.logoUrl ?? ''} onChange={(e) => set('logoUrl', e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cor Primária">
              <div className="flex gap-2">
                <input type="color" className="h-9 w-12 rounded border" value={form.primaryColor || '#000000'} onChange={(e) => set('primaryColor', e.target.value)} />
                <input className="flex-1 rounded border px-3 py-1.5" value={form.primaryColor ?? ''} onChange={(e) => set('primaryColor', e.target.value)} />
              </div>
            </Field>
            <Field label="Cor Secundária">
              <div className="flex gap-2">
                <input type="color" className="h-9 w-12 rounded border" value={form.secondaryColor || '#000000'} onChange={(e) => set('secondaryColor', e.target.value)} />
                <input className="flex-1 rounded border px-3 py-1.5" value={form.secondaryColor ?? ''} onChange={(e) => set('secondaryColor', e.target.value)} />
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Informações Públicas">
          <Field label="Nome de Exibição">
            <input className="w-full rounded border px-3 py-1.5" value={form.displayName ?? ''} onChange={(e) => set('displayName', e.target.value)} />
          </Field>
          <Field label="Website">
            <input type="url" className="w-full rounded border px-3 py-1.5" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email de Contato">
              <input type="email" className="w-full rounded border px-3 py-1.5" value={form.contactEmail ?? ''} onChange={(e) => set('contactEmail', e.target.value)} />
            </Field>
            <Field label="Telefone de Contato">
              <input className="w-full rounded border px-3 py-1.5" value={form.contactPhone ?? ''} onChange={(e) => set('contactPhone', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Preferências">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Fuso Horário">
              <select className="w-full rounded border px-3 py-1.5" value={form.timezone ?? ''} onChange={(e) => set('timezone', e.target.value)}>
                <option value="">Selecione</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
                <option value="America/Manaus">America/Manaus (UTC-4)</option>
                <option value="America/Belem">America/Belem (UTC-3)</option>
                <option value="America/Noronha">America/Noronha (UTC-2)</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
            <Field label="Moeda">
              <select className="w-full rounded border px-3 py-1.5" value={form.currency ?? ''} onChange={(e) => set('currency', e.target.value)}>
                <option value="">Selecione</option>
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </Field>
            <Field label="Formato de Data">
              <select className="w-full rounded border px-3 py-1.5" value={form.dateFormat ?? ''} onChange={(e) => set('dateFormat', e.target.value)}>
                <option value="">Selecione</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Atendimento">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Duração Padrão (min)">
              <input type="number" min="1" className="w-full rounded border px-3 py-1.5" value={form.defaultAppointmentDuration ?? ''} onChange={(e) => set('defaultAppointmentDuration', e.target.value)} />
            </Field>
            <Field label="Limite Cancelamento (h)">
              <input type="number" min="0" className="w-full rounded border px-3 py-1.5" value={form.cancellationLimitHours ?? ''} onChange={(e) => set('cancellationLimitHours', e.target.value)} />
            </Field>
            <Field label="Agendamento Online">
              <select className="w-full rounded border px-3 py-1.5" value={form.allowOnlineScheduling === true || form.allowOnlineScheduling === 'true' ? 'true' : 'false'} onChange={(e) => set('allowOnlineScheduling', e.target.value)}>
                <option value="false">Desativado</option>
                <option value="true">Ativado</option>
              </select>
            </Field>
          </div>
        </Section>

        <div className="flex gap-4">
          <button type="submit" disabled={saving}
            className="rounded bg-zinc-900 px-6 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
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

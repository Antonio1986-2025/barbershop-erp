'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchCompany, updateCompany } from '@/lib/companies';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';

export default function EditarEmpresaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({
    corporateName: '', tradeName: '', document: '', email: '', phone: '', status: 'ACTIVE',
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  useEffect(() => {
    fetchCompany(id)
      .then((c) => {
        setForm({
          corporateName: c.corporateName,
          tradeName: c.tradeName ?? '',
          document: c.document,
          email: c.email,
          phone: c.phone ?? '',
          status: c.status,
        });
        setSubscription(c.subscription);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.corporateName.trim()) { setError('Nome é obrigatório'); return; }
    if (!form.document.trim()) { setError('Documento é obrigatório'); return; }
    if (!form.email.trim()) { setError('Email é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = { ...form };
      for (const k of Object.keys(payload)) {
        if (!(payload as any)[k]) (payload as any)[k] = undefined;
      }
      await updateCompany(id, payload);
      router.push('/empresas');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="mx-auto max-w-lg p-6"><p className="text-zinc-500">Carregando...</p></div>;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Editar Empresa</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome Fantasia *">
          <input className="w-full rounded border px-3 py-1.5" value={form.corporateName} onChange={(e) => set('corporateName', e.target.value)} required />
        </FormField>
        <FormField label="Razão Social">
          <input className="w-full rounded border px-3 py-1.5" value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)} />
        </FormField>
        <FormField label="Documento (CNPJ/CPF) *">
          <input className="w-full rounded border px-3 py-1.5" value={form.document} onChange={(e) => set('document', e.target.value)} required />
        </FormField>
        <FormField label="Email *">
          <input type="email" className="w-full rounded border px-3 py-1.5" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </FormField>
        <FormField label="Telefone">
          <input className="w-full rounded border px-3 py-1.5" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </FormField>
        <FormField label="Status">
          <select className="w-full rounded border px-3 py-1.5" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="SUSPENDED">Suspenso</option>
          </select>
        </FormField>

        {subscription && (
          <div className="rounded-lg border p-4 text-sm">
            <h3 className="mb-2 font-semibold text-zinc-600">Assinatura</h3>
            <p>Plano: <strong>{subscription.plan?.name}</strong></p>
            <p>Status: <strong>{subscription.status}</strong></p>
            <p>Início: {new Date(subscription.startDate).toLocaleDateString()}</p>
            {subscription.endDate && <p>Término: {new Date(subscription.endDate).toLocaleDateString()}</p>}
          </div>
        )}

        <FormActions backTo="/empresas" saving={saving} />
      </form>
    </div>
  );
}

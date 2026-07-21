'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchCustomer, updateCustomer } from '@/lib/customers';

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    birthDate: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    fetchCustomer(id)
      .then((c) => {
        setForm({
          name: c.name,
          email: c.email ?? '',
          phone: c.phone ?? '',
          document: c.document ?? '',
          birthDate: c.birthDate ? c.birthDate.slice(0, 10) : '',
          notes: c.notes ?? '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateCustomer(id, {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        document: form.document || undefined,
        birthDate: form.birthDate || undefined,
        notes: form.notes || undefined,
      });
      router.push('/clientes');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <p className="text-zinc-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Editar Cliente</h1>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <input
            className="w-full rounded border px-3 py-1.5"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="w-full rounded border px-3 py-1.5"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Telefone">
          <input
            className="w-full rounded border px-3 py-1.5"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Field>
        <Field label="Documento (CPF/CNPJ)">
          <input
            className="w-full rounded border px-3 py-1.5"
            value={form.document}
            onChange={(e) => set('document', e.target.value)}
          />
        </Field>
        <Field label="Data de Nascimento">
          <input
            type="date"
            className="w-full rounded border px-3 py-1.5"
            value={form.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
        </Field>
        <Field label="Observações">
          <textarea
            className="w-full rounded border px-3 py-1.5"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
            onClick={() => router.push('/clientes')}
          >
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

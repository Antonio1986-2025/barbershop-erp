'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProfessional } from '@/lib/professionals';
import { fetchUnits } from '@/lib/units';
import type { Unit } from '@/lib/units';

export default function NovoProfissionalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    specialty: '',
  });
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUnits().then(setUnits).catch(() => {});
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleUnit(unitId: string) {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createProfessional({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        document: form.document || undefined,
        specialty: form.specialty || undefined,
        unitIds: selectedUnitIds.length > 0 ? selectedUnitIds : undefined,
      });
      router.push('/profissionais');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Novo Profissional</h1>

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
        <Field label="Especialidade">
          <input
            className="w-full rounded border px-3 py-1.5"
            value={form.specialty}
            onChange={(e) => set('specialty', e.target.value)}
          />
        </Field>

        {units.length > 0 && (
          <Field label="Unidades (vínculo)">
            <div className="space-y-1">
              {units.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedUnitIds.includes(u.id)}
                    onChange={() => toggleUnit(u.id)}
                  />
                  {u.name} ({u.code})
                </label>
              ))}
            </div>
          </Field>
        )}

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
            onClick={() => router.push('/profissionais')}
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

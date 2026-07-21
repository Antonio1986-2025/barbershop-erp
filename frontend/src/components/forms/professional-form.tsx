'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProfessional, updateProfessional } from '@/lib/professionals';
import { fetchUnits } from '@/lib/units';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';
import type { Professional } from '@/lib/professionals';

interface ProfessionalFormProps {
  initial?: Professional;
}

export function ProfessionalForm({ initial }: ProfessionalFormProps) {
  const router = useRouter();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    document: initial?.document ?? '',
    specialty: initial?.specialty ?? '',
  });
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(
    initial?.units?.map((u) => u.unitId) ?? [],
  );
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
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId],
    );
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
        specialty: form.specialty || undefined,
        unitIds: selectedUnitIds.length > 0 ? selectedUnitIds : (isEdit ? [] : undefined),
      };
      if (isEdit) {
        await updateProfessional(initial!.id, payload);
      } else {
        await createProfessional(payload as any);
      }
      router.push('/profissionais');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Editar Profissional' : 'Novo Profissional'}</h1>
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
        <FormField label="Especialidade">
          <input className="w-full rounded border px-3 py-1.5" value={form.specialty}
            onChange={(e) => set('specialty', e.target.value)} />
        </FormField>
        {units.length > 0 && (
          <FormField label="Unidades (vínculo)">
            <div className="space-y-1">
              {units.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedUnitIds.includes(u.id)}
                    onChange={() => toggleUnit(u.id)} />
                  {u.name} ({u.code})
                </label>
              ))}
            </div>
          </FormField>
        )}
        <FormActions backTo="/profissionais" saving={saving} />
      </form>
    </div>
  );
}

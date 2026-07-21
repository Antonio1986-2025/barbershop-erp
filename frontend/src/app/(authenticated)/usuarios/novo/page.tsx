'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/users';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', password: '', roleIds: [] as string[],
  });
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const token = localStorage.getItem('barbershop_access_token');
    fetch(`${API}/api/roles`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {});
  }, []);

  function set(field: string, value: any) { setForm((p) => ({ ...p, [field]: value })); }

  function toggleRole(roleId: string) {
    setForm((p) => ({
      ...p,
      roleIds: p.roleIds.includes(roleId)
        ? p.roleIds.filter((id) => id !== roleId)
        : [...p.roleIds, roleId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    if (!form.email.trim()) { setError('Email é obrigatório'); return; }
    if (!form.password) { setError('Senha é obrigatória'); return; }
    if (form.password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres'); return; }
    setSaving(true); setError('');
    try {
      await createUser({
        name: form.name, email: form.email, password: form.password,
        roleIds: form.roleIds.length > 0 ? form.roleIds : undefined,
      });
      router.push('/usuarios');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold">Novo Usuário</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </FormField>
        <FormField label="Email *">
          <input type="email" className="w-full rounded border px-3 py-1.5" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </FormField>
        <FormField label="Senha *">
          <input type="password" className="w-full rounded border px-3 py-1.5" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} />
        </FormField>
        {roles.length > 0 && (
          <FormField label="Roles (permissões)">
            <div className="space-y-1">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.roleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id)} />
                  {r.name}
                </label>
              ))}
            </div>
          </FormField>
        )}
        <FormActions backTo="/usuarios" saving={saving} />
      </form>
    </div>
  );
}

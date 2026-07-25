'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomer, updateCustomer, fetchCustomerByPhone } from '@/lib/customers';
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

  // Fase 1: criação — fluxo telefone-primeiro
  const [phonePhase, setPhonePhase] = useState(!isEdit);
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [searching, setSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(isEdit ? initial : null);
  const [newName, setNewName] = useState('');

  // Fase 2: edição completa dos campos (só para cadastro já existente)
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

  // —— Fluxo telefone-primeiro (criação) ——

  function handlePhoneChange(value: string) {
    setPhone(value);
    setFoundCustomer(null);
    const raw = value.replace(/\D/g, '');
    if (raw.length === 13) {
      setSearching(true);
      setError('');
      fetchCustomerByPhone(raw)
        .then(c => {
          if (c) {
            setFoundCustomer(c);
            setForm(prev => ({ ...prev, name: c.name, phone: c.phone ?? value }));
            setNewName('');
          }
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }
  }

  async function handleQuickSave() {
    const raw = phone.replace(/\D/g, '');
    if (raw.length < 10) { setError('Telefone inválido'); return; }
    if (!newName.trim()) { setError('Informe o nome do cliente'); return; }
    setSaving(true); setError('');
    try {
      const novo = await createCustomer({ name: newName.trim(), phone: raw } as any);
      router.push('/clientes');
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  function handleUseExisting() {
    // Cliente já existe — redireciona
    router.push('/clientes');
  }

  // —— Fluxo de edição (todos os campos) ——

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
      }
      router.push('/clientes');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  // —— Render ——

  if (phonePhase && !isEdit) {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-6">
        <h1 className="text-xl font-bold sm:text-2xl">Novo Cliente</h1>
        <p className="text-sm text-muted-foreground">Informe o telefone para começar</p>
        <ErrorBox message={error} />
        <div className="space-y-4">
          <FormField label="Telefone *">
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="Ex.: (11) 98765-4321"
              disabled={!!foundCustomer}
              autoFocus
              required
            />
          </FormField>

          {searching && <p className="text-sm text-muted-foreground animate-pulse">Pesquisando...</p>}

          {foundCustomer ? (
            <div className="space-y-3">
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                Cliente já cadastrado: <strong>{foundCustomer.name}</strong>
                {foundCustomer.phone && <span> — {foundCustomer.phone}</span>}
              </div>
              <button
                onClick={handleUseExisting}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-light transition-colors">
                Ir para Lista de Clientes
              </button>
            </div>
          ) : phone.replace(/\D/g, '').length === 13 && !searching ? (
            <div className="space-y-4">
              <FormField label="Nome *">
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nome do cliente"
                  autoFocus
                  required
                />
              </FormField>
              <button
                onClick={handleQuickSave}
                disabled={saving}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-light disabled:opacity-50 transition-colors">
                {saving ? 'Salvando...' : 'Cadastrar Cliente'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Edição (ou cliente já existente)
  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-xl font-bold sm:text-2xl">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome *">
          <input className="w-full rounded border px-3 py-1.5" value={form.name}
            onChange={(e) => set('name', e.target.value)} required />
        </FormField>
        <FormField label="Telefone *">
          <input className="w-full rounded border px-3 py-1.5" value={form.phone}
            onChange={(e) => set('phone', e.target.value)} required />
        </FormField>
        <FormField label="Email">
          <input type="email" className="w-full rounded border px-3 py-1.5" value={form.email}
            onChange={(e) => set('email', e.target.value)} />
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

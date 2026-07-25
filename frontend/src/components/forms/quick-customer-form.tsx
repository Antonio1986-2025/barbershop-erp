'use client';

import { useState, useEffect } from 'react';
import { createCustomer, fetchCustomerByPhone } from '@/lib/customers';
import { FormField } from '@/components/forms/form-field';
import { ErrorBox } from '@/components/crud/error-box';
import type { Customer } from '@/lib/customers';

export function QuickCustomerForm({ onSave }: { onSave: (customer: Customer) => void }) {
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = phone.replace(/\D/g, '');
    if (raw.length === 13) {
      setSearching(true);
      setError('');
      fetchCustomerByPhone(raw)
        .then(c => {
          if (c) {
            setCustomer(c);
            setName(c.name);
          } else {
            setCustomer(null);
          }
        })
        .catch(() => {
          setCustomer(null);
        })
        .finally(() => setSearching(false));
    } else {
      setCustomer(null);
    }
  }, [phone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) {
      if (!name.trim()) { setError('Informe o nome do cliente'); return; }
      const raw = phone.replace(/\D/g, '');
      if (raw.length < 10) { setError('Telefone inválido'); return; }
      setSaving(true);
      setError('');
      try {
        const novo = await createCustomer({ name: name.trim(), phone: raw } as any);
        setCustomer(novo);
        onSave(novo);
      } catch (e: any) { setError(e.message); setSaving(false); }
    } else {
      onSave(customer);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <ErrorBox message={error} />
      <FormField label="Telefone *">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={phone}
          onChange={e => { setPhone(e.target.value); setCustomer(null); }}
          placeholder="Ex.: (11) 98765-4321"
          disabled={!!customer}
          required
        />
      </FormField>
      {searching && <p className="text-sm text-muted-foreground animate-pulse">Pesquisando...</p>}
      {customer ? (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          Cliente encontrado: <strong>{customer.name}</strong>
          {customer.phone && <span> — {customer.phone}</span>}
        </div>
      ) : phone.replace(/\D/g, '').length === 13 && !searching ? (
        <FormField label="Nome *">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Nome do cliente"
            autoFocus
            required
          />
        </FormField>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={saving || searching}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-light disabled:opacity-50 transition-colors">
          {saving ? 'Salvando...' : customer ? 'Usar este cliente' : 'Cadastrar Cliente'}
        </button>
      </div>
    </form>
  );
}

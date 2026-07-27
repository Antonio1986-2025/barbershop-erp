'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createAppointment } from '@/lib/appointments';
import { fetchCustomers } from '@/lib/customers';
import { fetchProfessionals } from '@/lib/professionals';
import { fetchUnits } from '@/lib/units';
import { fetchServices } from '@/lib/services';
import { fetchAvailability } from '@/lib/schedule';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { ErrorBox } from '@/components/crud/error-box';
import type { Customer } from '@/lib/customers';
import type { Professional } from '@/lib/professionals';
import type { Unit } from '@/lib/units';
import type { Service } from '@/lib/services';

function NovoAgendamentoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [units, setUnits] = useState<Unit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [unitId, setUnitId] = useState(searchParams.get('unitId') ?? '');
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') ?? '');
  const [professionalId, setProfessionalId] = useState(searchParams.get('professionalId') ?? '');
  const [serviceId, setServiceId] = useState(searchParams.get('serviceId') ?? '');
  const [date, setDate] = useState(searchParams.get('date') ?? '');
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');

  // 🔹 Novo cliente
  const [newCustomer, setNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // 🔹 Abrir comanda
  const [createSale, setCreateSale] = useState(true);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {});
    fetchCustomers({ limit: 200 }).then(r => setCustomers(r.data ?? [])).catch(() => {});
    fetchProfessionals({}).then(r => setProfessionals(r.data ?? r)).catch(() => {});
    fetchServices({ limit: 200 }).then(r => setServices(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!unitId || !date) {
      setSlots([]);
      setSlot('');
      return;
    }
    setSlotsLoading(true);
    setSlotsError('');
    fetchAvailability({
      unitId,
      date,
      professionalId: professionalId || undefined,
      serviceId: serviceId || undefined,
    })
      .then(r => {
        setSlots(r.slots);
        setSlot('');
      })
      .catch(e => setSlotsError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [unitId, professionalId, serviceId, date]);

  function formatSlot(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!unitId || !professionalId || !serviceId || !slot) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (newCustomer) {
      if (!newName.trim()) {
        setError('Informe o nome do novo cliente');
        return;
      }
    } else if (!customerId) {
      setError('Selecione um cliente ou clique em "Novo Cliente"');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await createAppointment({
        unitId,
        professionalId,
        customerId: newCustomer ? undefined : customerId,
        serviceId,
        startAt: slot,
        notes: notes || undefined,
        newCustomerName: newCustomer ? newName.trim() : undefined,
        newCustomerPhone: newCustomer ? newPhone.trim() : undefined,
        createSale,
      });
      router.push('/agendamentos');
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  function toggleNewCustomer() {
    setNewCustomer(!newCustomer);
    if (!newCustomer) {
      setCustomerId('');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <h1 className="text-xl font-bold sm:text-2xl">Novo Agendamento</h1>
      <ErrorBox message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Unidade *">
          <select className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={unitId} onChange={e => setUnitId(e.target.value)} required>
            <option value="">Selecione...</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </FormField>

        {/* 🔹 Cliente: toggle entre existente e novo */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Cliente *</label>
          <button type="button"
            className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
            onClick={toggleNewCustomer}>
            {newCustomer ? 'Usar cliente existente' : '+ Novo Cliente'}
          </button>
        </div>

        {newCustomer ? (
          <div className="space-y-3 rounded-md border border-border bg-card-bg p-3">
            <FormField label="Nome do cliente *">
              <input className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Ex: João Silva" autoFocus />
            </FormField>
            <FormField label="Telefone">
              <input className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={newPhone} onChange={e => setNewPhone(e.target.value)}
                placeholder="(11) 99999-9999" />
            </FormField>
          </div>
        ) : (
          <select className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={customerId} onChange={e => setCustomerId(e.target.value)} required>
            <option value="">Selecione...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.phone ? ` - ${c.phone}` : ''}
              </option>
            ))}
          </select>
        )}

        <FormField label="Profissional *">
          <select className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={professionalId} onChange={e => setProfessionalId(e.target.value)} required>
            <option value="">Selecione...</option>
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>

        <FormField label="Serviço *">
          <select className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={serviceId} onChange={e => setServiceId(e.target.value)} required>
            <option value="">Selecione...</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} - {s.durationMinutes}min - R$ {Number(s.price).toFixed(2)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Data *">
          <input type="date" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={date} onChange={e => setDate(e.target.value)} required />
        </FormField>

        <FormField label="Horário *">
          {!unitId || !date ? (
            <p className="text-sm text-muted-foreground">Selecione unidade e data para ver horários disponíveis</p>
          ) : slotsLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Carregando horários...</p>
          ) : slotsError ? (
            <p className="text-sm text-danger">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum horário disponível. Verifique o expediente da unidade e a disponibilidade do profissional.</p>
          ) : (
            <select className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={slot} onChange={e => setSlot(e.target.value)} required>
              <option value="">Selecione um horário</option>
              {slots.map(s => (
                <option key={s} value={s}>{formatSlot(s)}</option>
              ))}
            </select>
          )}
        </FormField>

        {/* 🔹 Abrir comanda */}
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={createSale}
            onChange={e => setCreateSale(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
          <span>Abrir comanda com este serviço</span>
        </label>

        <FormField label="Observações">
          <textarea className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional..." />
        </FormField>

        <FormActions backTo="/agendamentos" saving={saving} />
      </form>
    </div>
  );
}

export default function NovoAgendamentoPage() {
  return (
    <Suspense fallback={<p className="px-4 py-6 sm:px-6 text-muted-foreground">Carregando...</p>}>
      <NovoAgendamentoForm />
    </Suspense>
  );
}

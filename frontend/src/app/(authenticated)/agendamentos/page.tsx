'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAppointments, cancelAppointment, rescheduleAppointment, updateAppointmentStatus, deleteAppointment } from '@/lib/appointments';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/appointments';
import type { Appointment } from '@/lib/appointments';
import { fetchCustomers } from '@/lib/customers';
import { fetchProfessionals } from '@/lib/professionals';
import { fetchUnits } from '@/lib/units';
import { fetchServices } from '@/lib/services';
import { ErrorBox } from '@/components/crud/error-box';
import type { Customer } from '@/lib/customers';
import type { Professional } from '@/lib/professionals';
import type { Unit } from '@/lib/units';
import type { Service } from '@/lib/services';

export default function AgendamentosPage() {
  const router = useRouter();
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterUnit, setFilterUnit] = useState('');
  const [filterProfessional, setFilterProfessional] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  useEffect(() => {
    fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {});
    fetchProfessionals({}).then(r => setProfessionals(r.data ?? r)).catch(() => {});
  }, []);

  function load() {
    setLoading(true); setError('');
    fetchAppointments({
      startDate: dateRange.start,
      endDate: dateRange.end,
      unitId: filterUnit || undefined,
      professionalId: filterProfessional || undefined,
      status: filterStatus || undefined,
    })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [filterUnit, filterProfessional, filterStatus, dateRange]);

  async function handleCancel() {
    if (!selectedAppt) return;
    try {
      await cancelAppointment(selectedAppt.id, cancelReason);
      setShowCancelModal(false); setSelectedAppt(null); setCancelReason(''); load();
    } catch (e: any) { setError(e.message) }
  }

  async function handleReschedule() {
    if (!selectedAppt || !rescheduleDate || !rescheduleTime) return;
    try {
      const newStartAt = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
      await rescheduleAppointment(selectedAppt.id, newStartAt, rescheduleReason);
      setShowRescheduleModal(false); setSelectedAppt(null); setRescheduleDate(''); setRescheduleTime(''); setRescheduleReason(''); load();
    } catch (e: any) { setError(e.message) }
  }

  async function handleStatusChange(appt: Appointment, status: string) {
    try {
      await updateAppointmentStatus(appt.id, status); load();
    } catch (e: any) { setError(e.message) }
  }

  async function handleDelete(appt: Appointment) {
    if (!confirm(`Excluir agendamento de ${appt.customer.name}?`)) return;
    try { await deleteAppointment(appt.id); load() }
    catch (e: any) { setError(e.message) }
  }

  const activeStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/agendamentos/novo')}>Novo Agendamento</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Unidade</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
            <option value="">Todas</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Profissional</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterProfessional} onChange={e => setFilterProfessional(e.target.value)}>
            <option value="">Todos</option>
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">De</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Até</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
        </div>
      </div>

      <ErrorBox message={error} />

      {/* List */}
      {loading ? <p className="text-zinc-500">Carregando...</p> : data.length === 0 ? (
        <p className="text-zinc-500">Nenhum agendamento encontrado.</p>
      ) : (
        <div className="space-y-3">
          {data.map(appt => (
            <div key={appt.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{appt.customer.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appt.status] ?? ''}`}>
                      {STATUS_LABELS[appt.status] ?? appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600">
                    {new Date(appt.startAt).toLocaleString('pt-BR')} — {appt.service.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {appt.professional.name} {appt.unit ? `• ${appt.unit.name}` : ''}
                    {appt.customer.phone ? ` • ${appt.customer.phone}` : ''}
                  </p>
                  {appt.cancellationReason && (
                    <p className="text-xs text-red-600">Cancelamento: {appt.cancellationReason}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeStatuses.includes(appt.status) && (
                    <>
                      <button className="rounded bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100"
                        onClick={() => { setSelectedAppt(appt); setShowCancelModal(true) }}>Cancelar</button>
                      <button className="rounded bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100"
                        onClick={() => { setSelectedAppt(appt); setShowRescheduleModal(true) }}>Reagendar</button>
                    </>
                  )}
                  {appt.status === 'SCHEDULED' && (
                    <button className="rounded bg-green-50 px-3 py-1 text-xs text-green-700 hover:bg-green-100"
                      onClick={() => handleStatusChange(appt, 'CONFIRMED')}>Confirmar</button>
                  )}
                  {appt.status === 'CONFIRMED' && (
                    <button className="rounded bg-yellow-50 px-3 py-1 text-xs text-yellow-700 hover:bg-yellow-100"
                      onClick={() => handleStatusChange(appt, 'IN_PROGRESS')}>Iniciar</button>
                  )}
                  {appt.status === 'IN_PROGRESS' && (
                    <button className="rounded bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                      onClick={() => handleStatusChange(appt, 'COMPLETED')}>Concluir</button>
                  )}
                  <button className="rounded bg-zinc-50 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                    onClick={() => handleDelete(appt)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Cancelar Agendamento</h2>
            <p className="mb-2 text-sm text-zinc-600">Cliente: {selectedAppt.customer.name}</p>
            <label className="block text-sm font-medium mb-1">Motivo do cancelamento</label>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={3} value={cancelReason}
              onChange={e => setCancelReason(e.target.value)} placeholder="Opcional..." />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => { setShowCancelModal(false); setSelectedAppt(null); setCancelReason('') }}>Voltar</button>
              <button className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700" onClick={handleCancel}>Confirmar Cancelamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Reagendar</h2>
            <p className="mb-2 text-sm text-zinc-600">Cliente: {selectedAppt.customer.name}</p>
            <p className="mb-4 text-sm text-zinc-600">Serviço: {selectedAppt.service.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nova data</label>
                <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Novo horário</label>
                <input type="time" className="w-full rounded border px-3 py-2 text-sm" value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
                <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)} placeholder="Opcional..." />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => { setShowRescheduleModal(false); setSelectedAppt(null) }}>Voltar</button>
              <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={handleReschedule}>Confirmar Reagendamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

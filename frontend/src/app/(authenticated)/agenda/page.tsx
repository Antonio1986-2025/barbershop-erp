'use client';

import { useEffect, useState } from 'react';
import {
  fetchBusinessHours, createBusinessHour, updateBusinessHour, deleteBusinessHour,
  fetchScheduleBlocks, createScheduleBlock, updateScheduleBlock, deleteScheduleBlock,
  dayLabel,
} from '@/lib/schedule';
import type { BusinessHour, ScheduleBlock } from '@/lib/schedule';
import { fetchUnits } from '@/lib/units';
import { fetchProfessionals } from '@/lib/professionals';
import { ErrorBox } from '@/components/crud/error-box';
import type { Unit } from '@/lib/units';
import type { Professional } from '@/lib/professionals';

export default function AgendaPage() {
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'hours' | 'blocks'>('hours');

  // Hour form
  const [showHourForm, setShowHourForm] = useState(false);
  const [editingHour, setEditingHour] = useState<string | null>(null);
  const [hourUnit, setHourUnit] = useState('');
  const [hourDay, setHourDay] = useState(0);
  const [hourStart, setHourStart] = useState('08:00');
  const [hourEnd, setHourEnd] = useState('18:00');
  const [hourActive, setHourActive] = useState(true);

  // Block form
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [blockUnit, setBlockUnit] = useState('');
  const [blockProfessional, setBlockProfessional] = useState('');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockType, setBlockType] = useState('UNIT');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');

  useEffect(() => {
    fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {});
    fetchProfessionals({}).then(r => setProfessionals(r.data ?? r)).catch(() => {});
  }, []);

  function load() {
    setLoading(true); setError('');
    Promise.all([
      fetchBusinessHours(undefined, selectedUnit || undefined).then(setHours).catch(() => {}),
      fetchScheduleBlocks(selectedUnit || undefined).then(setBlocks).catch(() => {}),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [selectedUnit]);

  function resetHourForm() {
    setHourUnit(selectedUnit); setHourDay(0); setHourStart('08:00'); setHourEnd('18:00'); setHourActive(true);
    setEditingHour(null);
  }

  function resetBlockForm() {
    setBlockUnit(selectedUnit); setBlockProfessional(''); setBlockTitle(''); setBlockReason('');
    setBlockType('UNIT'); setBlockStart(''); setBlockEnd('');
    setEditingBlock(null);
  }

  async function handleSaveHour() {
    try {
      const unitId = hourUnit || selectedUnit;
      if (!unitId) { setError('Selecione uma unidade'); return }
      const payload = { unitId, dayOfWeek: hourDay, startTime: hourStart, endTime: hourEnd, active: hourActive };
      if (editingHour) {
        await updateBusinessHour(editingHour, payload);
      } else {
        await createBusinessHour(payload);
      }
      setShowHourForm(false); resetHourForm(); load();
    } catch (e: any) { setError(e.message) }
  }

  async function handleSaveBlock() {
    try {
      const unitId = blockUnit || selectedUnit;
      if (!unitId) { setError('Selecione uma unidade'); return }
      if (!blockTitle) { setError('Informe um título'); return }
      if (!blockStart || !blockEnd) { setError('Informe data/hora de início e fim'); return }
      const payload = {
        unitId,
        professionalId: blockProfessional || undefined,
        title: blockTitle,
        reason: blockReason || undefined,
        type: blockType,
        startAt: new Date(blockStart).toISOString(),
        endAt: new Date(blockEnd).toISOString(),
      };
      if (editingBlock) {
        await updateScheduleBlock(editingBlock, payload);
      } else {
        await createScheduleBlock(payload);
      }
      setShowBlockForm(false); resetBlockForm(); load();
    } catch (e: any) { setError(e.message) }
  }

  async function handleDeleteHour(id: string) {
    if (!confirm('Excluir este horário?')) return;
    try { await deleteBusinessHour(id); load() } catch (e: any) { setError(e.message) }
  }

  async function handleDeleteBlock(id: string) {
    if (!confirm('Excluir este bloqueio?')) return;
    try { await deleteScheduleBlock(id); load() } catch (e: any) { setError(e.message) }
  }

  function editHour(h: BusinessHour) {
    setEditingHour(h.id); setHourUnit(h.unitId); setHourDay(h.dayOfWeek);
    setHourStart(h.startTime); setHourEnd(h.endTime); setHourActive(h.active);
    setShowHourForm(true);
  }

  function editBlock(b: ScheduleBlock) {
    setEditingBlock(b.id); setBlockUnit(b.unitId); setBlockProfessional(b.professionalId ?? '');
    setBlockTitle(b.title); setBlockReason(b.reason ?? ''); setBlockType(b.type);
    setBlockStart(new Date(b.startAt).toISOString().slice(0, 16));
    setBlockEnd(new Date(b.endAt).toISOString().slice(0, 16));
    setShowBlockForm(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Agenda</h1>

      <div className="flex items-center gap-4">
        <select className="rounded border px-3 py-1.5 text-sm" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
          <option value="">Todas as unidades</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <div className="flex gap-1 rounded-lg border p-1">
          <button className={`rounded px-3 py-1 text-sm ${tab === 'hours' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            onClick={() => setTab('hours')}>Horários de Funcionamento</button>
          <button className={`rounded px-3 py-1 text-sm ${tab === 'blocks' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            onClick={() => setTab('blocks')}>Bloqueios</button>
        </div>
      </div>

      <ErrorBox message={error} />

      {tab === 'hours' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
              onClick={() => { resetHourForm(); setShowHourForm(true) }}>Novo Horário</button>
          </div>

          {loading ? <p className="text-zinc-500">Carregando...</p> : hours.length === 0 ? (
            <p className="text-zinc-500">Nenhum horário cadastrado.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Unidade</th>
                    <th className="px-4 py-2 text-left font-medium">Dia</th>
                    <th className="px-4 py-2 text-left font-medium">Abertura</th>
                    <th className="px-4 py-2 text-left font-medium">Fechamento</th>
                    <th className="px-4 py-2 text-left font-medium">Ativo</th>
                    <th className="px-4 py-2 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {hours.map(h => (
                    <tr key={h.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-2">{units.find(u => u.id === h.unitId)?.name ?? h.unitId}</td>
                      <td className="px-4 py-2">{dayLabel(h.dayOfWeek)}</td>
                      <td className="px-4 py-2">{h.startTime.slice(0, 5)}</td>
                      <td className="px-4 py-2">{h.endTime.slice(0, 5)}</td>
                      <td className="px-4 py-2">{h.active ? 'Sim' : 'Não'}</td>
                      <td className="flex justify-end gap-2 px-4 py-2">
                        <button className="text-xs text-blue-600 hover:underline" onClick={() => editHour(h)}>Editar</button>
                        <button className="text-xs text-red-600 hover:underline" onClick={() => handleDeleteHour(h.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'blocks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
              onClick={() => { resetBlockForm(); setShowBlockForm(true) }}>Novo Bloqueio</button>
          </div>

          {loading ? <p className="text-zinc-500">Carregando...</p> : blocks.length === 0 ? (
            <p className="text-zinc-500">Nenhum bloqueio cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {blocks.map(b => (
                <div key={b.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{b.title}</p>
                      <p className="text-sm text-zinc-600">
                        {new Date(b.startAt).toLocaleString('pt-BR')} — {new Date(b.endAt).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Unidade: {units.find(u => u.id === b.unitId)?.name ?? b.unitId}
                        {b.professional ? ` • Profissional: ${b.professional.name}` : ' • Geral'}
                        {b.reason ? ` • ${b.reason}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600 hover:underline" onClick={() => editBlock(b)}>Editar</button>
                      <button className="text-xs text-red-600 hover:underline" onClick={() => handleDeleteBlock(b.id)}>Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hour Form Modal */}
      {showHourForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editingHour ? 'Editar' : 'Novo'} Horário</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Unidade</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={hourUnit}
                  onChange={e => setHourUnit(e.target.value)}>
                  <option value="">Selecione...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dia da Semana</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={hourDay}
                  onChange={e => setHourDay(Number(e.target.value))}>
                  {[0,1,2,3,4,5,6].map(d => <option key={d} value={d}>{dayLabel(d)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Abertura</label>
                  <input type="time" className="w-full rounded border px-3 py-2 text-sm" value={hourStart}
                    onChange={e => setHourStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fechamento</label>
                  <input type="time" className="w-full rounded border px-3 py-2 text-sm" value={hourEnd}
                    onChange={e => setHourEnd(e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hourActive} onChange={e => setHourActive(e.target.checked)} />
                Ativo
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => { setShowHourForm(false); resetHourForm() }}>Cancelar</button>
              <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700" onClick={handleSaveHour}>
                {editingHour ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Form Modal */}
      {showBlockForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editingBlock ? 'Editar' : 'Novo'} Bloqueio</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Unidade</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={blockUnit}
                  onChange={e => setBlockUnit(e.target.value)}>
                  <option value="">Selecione...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select className="w-full rounded border px-3 py-2 text-sm" value={blockType}
                  onChange={e => setBlockType(e.target.value)}>
                  <option value="UNIT">Bloqueio da Unidade</option>
                  <option value="PROFESSIONAL">Bloqueio do Profissional</option>
                </select>
              </div>
              {blockType === 'PROFESSIONAL' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Profissional</label>
                  <select className="w-full rounded border px-3 py-2 text-sm" value={blockProfessional}
                    onChange={e => setBlockProfessional(e.target.value)}>
                    <option value="">Selecione...</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={blockTitle}
                  onChange={e => setBlockTitle(e.target.value)} placeholder="Ex: Feriado" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
                <input className="w-full rounded border px-3 py-2 text-sm" value={blockReason}
                  onChange={e => setBlockReason(e.target.value)} placeholder="Opcional..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Início</label>
                  <input type="datetime-local" className="w-full rounded border px-3 py-2 text-sm" value={blockStart}
                    onChange={e => setBlockStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fim</label>
                  <input type="datetime-local" className="w-full rounded border px-3 py-2 text-sm" value={blockEnd}
                    onChange={e => setBlockEnd(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => { setShowBlockForm(false); resetBlockForm() }}>Cancelar</button>
              <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700" onClick={handleSaveBlock}>
                {editingBlock ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

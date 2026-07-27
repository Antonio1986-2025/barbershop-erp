'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { ErrorBox } from '@/components/crud/error-box';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function apiHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function BarberAgendaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('barber')) { router.replace('/dashboard'); return; }
    load();
  }, [user, filter]);

  async function load() {
    setLoading(true);
    try {
      const url = filter
        ? `${API_BASE}/api/barber/appointments?status=${filter}`
        : `${API_BASE}/api/barber/appointments`;
      const r = await fetch(url, { headers: apiHeaders() });
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-600',
  };
  const statusLabels: Record<string, string> = {
    SCHEDULED: 'Agendado', CONFIRMED: 'Confirmado', IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
  };

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Minha Agenda</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-border bg-card-bg px-3 py-1.5 text-sm">
          <option value="">Todos</option>
          <option value="SCHEDULED">Agendados</option>
          <option value="CONFIRMED">Confirmados</option>
          <option value="COMPLETED">Concluídos</option>
        </select>
      </div>

      {data.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">Nenhum agendamento encontrado.</p></div>
      ) : (
        <div className="space-y-3">
          {data.map((apt: any) => (
            <div key={apt.id} className="rounded-lg border border-border bg-card-bg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{apt.customer?.name ?? 'Cliente'}</p>
                  <p className="text-sm text-muted-foreground">{apt.service?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(apt.startAt).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[apt.status] ?? ''}`}>
                  {statusLabels[apt.status] ?? apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

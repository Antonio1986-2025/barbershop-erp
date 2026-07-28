'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { ErrorBox } from '@/components/crud/error-box';

function getApiBase(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return process.env.NEXT_PUBLIC_API_URL ?? `http://${window.location.hostname}:3001`;
}


function apiHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function BarberProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('barber')) { router.replace('/dashboard'); return; }
    load();
  }, [user]);

  async function load() {
    try {
      const r = await fetch(`/api/barber/profile`, { headers: apiHeaders() });
      setData(await r.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-lg px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold sm:text-2xl">Meu Perfil</h1>

      <div className="rounded-lg border border-border bg-card-bg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
            💈
          </div>
          <div>
            <p className="text-lg font-bold">{data.name}</p>
            {data.specialty && <p className="text-sm text-muted-foreground">{data.specialty}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <InfoRow label="Email" value={data.email ?? '-'} />
          <InfoRow label="Telefone" value={data.phone ?? '-'} />
          <InfoRow label="Especialidade" value={data.specialty ?? '-'} />
          <InfoRow label="Comissão" value={data.commissionRate ? `${data.commissionRate}%` : 'Não configurada'} />
          <InfoRow label="Status" value={data.active ? 'Ativo' : 'Inativo'} />
          {data.units && data.units.length > 0 && (
            <InfoRow label="Unidades" value={data.units.map((u: any) => u.unit?.name).join(', ')} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/30 pb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

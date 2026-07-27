'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { ErrorBox } from '@/components/crud/error-box';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function BarberDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('barber')) { router.replace('/dashboard'); return; }

    const token = getToken();
    fetch(`${API_BASE}/api/barber/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Minha Dashboard</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <Card value={data.appointmentsToday?.total ?? 0} label="Atendimentos hoje" color="blue" />
        <Card value={data.servicesToday ?? 0} label="Serviços realizados" color="green" />
        <Card value={data.productsSoldToday ?? 0} label="Produtos vendidos" color="purple" />
        <Card value={`R$ ${(data.totalSoldToday ?? 0).toFixed(2)}`} label="Valor vendido" color="amber" />
      </div>

      {/* Next appointment */}
      {data.nextAppointment && (
        <div className="rounded-lg border border-border bg-card-bg p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">PRÓXIMO CLIENTE</h2>
          <p className="text-lg font-bold">{data.nextAppointment.customerName}</p>
          <p className="text-sm text-muted-foreground">
            {data.nextAppointment.serviceName} — {new Date(data.nextAppointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <QuickLink href="/barber/agenda" label="Minha Agenda" icon="📅" />
        <QuickLink href="/barber/service-orders" label="Minhas Comandas" icon="📋" />
        <QuickLink href="/barber/sales" label="Minhas Vendas" icon="💰" />
        <QuickLink href="/barber/profile" label="Meu Perfil" icon="👤" />
      </div>
    </div>
  );
}

function Card({ value, label, color }: { value: string | number; label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color] ?? colors.blue}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border bg-card-bg p-4 hover:bg-muted transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

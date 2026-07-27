'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { fetchServiceOrders, type ServiceOrder } from '@/lib/service-orders';
import { ErrorBox } from '@/components/crud/error-box';

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Atendimento',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
  CANCELLED: 'Cancelada',
};

export default function BarberServiceOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('barber')) { router.replace('/dashboard'); return; }
    load();
  }, [user]);

  function load() {
    setLoading(true);
    setError('');
    fetchServiceOrders({ professionalId: user?.id })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4 px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold sm:text-2xl">Minhas Comandas</h1>
      {data.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">Nenhuma comanda encontrada.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Total</th>
                <th className="p-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.map((so) => (
                <tr key={so.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{so.customer?.name ?? '-'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[so.status] ?? ''}`}>
                      {statusLabels[so.status] ?? so.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold">R$ {Number(so.total).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(so.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

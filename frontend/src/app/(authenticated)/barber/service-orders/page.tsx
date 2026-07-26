'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ErrorBox } from '@/components/crud/error-box';

export default function BarberServiceOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('barber')) { router.replace('/dashboard'); return; }
    load();
  }, [user]);

  async function load() {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/barber/service-orders', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-600',
  };

  if (loading) return <div className="flex justify-center py-12"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Minhas Comandas</h1>
      {data.length === 0 ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">Nenhuma comanda encontrada.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.map((so: any) => (
                <tr key={so.id} className="border-b border-border/50">
                  <td className="py-3 font-medium">{so.customer?.name ?? '-'}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[so.status] ?? ''}`}>{so.status}</span>
                  </td>
                  <td className="py-3 text-right">R$ {Number(so.total).toFixed(2)}</td>
                  <td className="py-3 text-muted-foreground">{new Date(so.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { fetchServiceOrders, type ServiceOrder } from '@/lib/service-orders';
import { DataTable } from '@/components/crud/data-table';
import { ErrorBox } from '@/components/crud/error-box';
import { Pagination } from '@/components/crud/pagination';

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

export default function ServiceOrdersPage() {
  const [data, setData] = useState<ServiceOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    fetchServiceOrders({ page, limit: 10 })
      .then((r) => { setData(r.data); setMeta(r.meta); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <h1 className="text-xl font-bold sm:text-2xl">Comandas</h1>
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Cliente', render: (so: ServiceOrder) => <span className="font-medium">{so.customer?.name ?? '-'}</span> },
          { header: 'Profissional', render: (so: ServiceOrder) => so.professional?.name ?? '-' },
          {
            header: 'Status', render: (so: ServiceOrder) => (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[so.status] ?? ''}`}>
                {statusLabels[so.status] ?? so.status}
              </span>
            ),
          },
          { header: 'Total', render: (so: ServiceOrder) => <span className="font-semibold">R$ {Number(so.total).toFixed(2)}</span> },
          { header: 'Data', render: (so: ServiceOrder) => new Date(so.createdAt).toLocaleDateString('pt-BR') },
        ]}
        data={data}
        loading={loading}
        emptyMessage="Nenhuma comanda encontrada."
      />
      {meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}

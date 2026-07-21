'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchServices, deleteService } from '@/lib/services';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { Service } from '@/lib/services';

export default function ServicosPage() {
  const router = useRouter();
  const [data, setData] = useState<Service[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchServices({ page, limit: 10, search: search || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: Service) {
    if (!confirm(`Excluir serviço "${item.name}"?`)) return;
    try { await deleteService(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/servicos/novo')}>Novo Serviço</button>
      </div>
      <SearchBar placeholder="Buscar por nome..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (s: Service) => <span className="font-medium">{s.name}</span> },
          { header: 'Duração', render: (s: Service) => `${s.durationMinutes} min` },
          { header: 'Preço', render: (s: Service) => `R$ ${Number(s.price).toFixed(2)}` },
          { header: 'Comissão', render: (s: Service) =>
            s.commissionType ? `${s.commissionType} ${s.commissionValue ?? ''}${s.commissionType === 'PERCENTAGE' ? '%' : ''}` : '-' },
        ]}
        data={data} loading={loading} emptyMessage="Nenhum serviço encontrado."
        onEdit={(s) => router.push(`/servicos/${s.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

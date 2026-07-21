'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUnits, deleteUnit } from '@/lib/units';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { Unit } from '@/lib/units';

export default function UnidadesPage() {
  const router = useRouter();
  const [data, setData] = useState<Unit[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchUnits({ page, limit: 10, search: search || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: Unit) {
    if (!confirm(`Excluir unidade "${item.name}"?`)) return;
    try { await deleteUnit(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unidades</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/unidades/novo')}>Nova Unidade</button>
      </div>
      <SearchBar placeholder="Buscar por nome ou código..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (u: Unit) => <span className="font-medium">{u.name}</span> },
          { header: 'Código', render: (u: Unit) => u.code },
          { header: 'Cidade', render: (u: Unit) => u.city ?? '-' },
          { header: 'UF', render: (u: Unit) => u.state ?? '-' },
          { header: 'Status', render: (u: Unit) => u.status },
        ]}
        data={data} loading={loading} emptyMessage="Nenhuma unidade encontrada."
        onEdit={(u) => router.push(`/unidades/${u.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

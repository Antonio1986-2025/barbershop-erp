'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProfessionals, deleteProfessional } from '@/lib/professionals';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { Professional } from '@/lib/professionals';

export default function ProfissionaisPage() {
  const router = useRouter();
  const [data, setData] = useState<Professional[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchProfessionals({ page, limit: 10, search: search || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: Professional) {
    if (!confirm(`Excluir profissional "${item.name}"?`)) return;
    try { await deleteProfessional(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/profissionais/novo')}>Novo Profissional</button>
      </div>
      <SearchBar placeholder="Buscar por nome, telefone ou documento..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (p: Professional) => <span className="font-medium">{p.name}</span> },
          { header: 'Telefone', render: (p: Professional) => p.phone ?? '-' },
          { header: 'Especialidade', render: (p: Professional) => p.specialty ?? '-' },
          { header: 'Unidades', render: (p: Professional) =>
            p.units?.length ? p.units.map((u) => u.unit.name).join(', ') : '-' },
        ]}
        data={data} loading={loading} emptyMessage="Nenhum profissional encontrado."
        onEdit={(p) => router.push(`/profissionais/${p.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

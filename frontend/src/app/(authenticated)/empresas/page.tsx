'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCompanies, deleteCompany } from '@/lib/companies';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { Company } from '@/lib/companies';

export default function EmpresasPage() {
  const router = useRouter();
  const [data, setData] = useState<Company[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchCompanies({ page, limit: 10, search: search || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: Company) {
    if (!confirm(`Desativar empresa "${item.corporateName}"?`)) return;
    try { await deleteCompany(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/empresas/novo')}>Nova Empresa</button>
      </div>
      <SearchBar placeholder="Buscar por nome ou documento..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (c: Company) => <span className="font-medium">{c.corporateName}</span> },
          { header: 'Documento', render: (c: Company) => c.document },
          { header: 'Email', render: (c: Company) => c.email },
          { header: 'Status', render: (c: Company) => c.status },
          { header: 'Plano', render: (c: Company) => c.subscription?.plan?.name ?? '-' },
        ]}
        data={data} loading={loading} emptyMessage="Nenhuma empresa encontrada."
        onEdit={(c) => router.push(`/empresas/${c.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCustomers, deleteCustomer } from '@/lib/customers';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { Customer } from '@/lib/customers';

export default function ClientesPage() {
  const router = useRouter();
  const [data, setData] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchCustomers({ page, limit: 10, search: search || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: Customer) {
    if (!confirm(`Excluir cliente "${item.name}"?`)) return;
    try { await deleteCustomer(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/clientes/novo')}>Novo Cliente</button>
      </div>
      <SearchBar placeholder="Buscar por nome, telefone ou documento..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (c: Customer) => <span className="font-medium">{c.name}</span> },
          { header: 'Telefone', render: (c: Customer) => c.phone ?? '-' },
          { header: 'Email', render: (c: Customer) => c.email ?? '-' },
          { header: 'Documento', render: (c: Customer) => c.document ?? '-' },
        ]}
        data={data} loading={loading} emptyMessage="Nenhum cliente encontrado."
        onEdit={(c) => router.push(`/clientes/${c.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

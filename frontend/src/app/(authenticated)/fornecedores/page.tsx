'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSuppliers, deleteSupplier } from '@/lib/suppliers';
import type { Supplier } from '@/lib/suppliers';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';

export default function FornecedoresPage() {
  const router = useRouter();
  const [data, setData] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchSuppliers({ page, limit: 10, search: search || undefined })
      .then(r => { setData(r.data); setMeta(r.meta) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: Supplier) {
    if (!confirm(`Excluir fornecedor "${item.name}"?`)) return;
    try { await deleteSupplier(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-light transition-colors"
          onClick={() => router.push('/fornecedores/novo')}>Novo Fornecedor</button>
      </div>
      <SearchBar placeholder="Buscar por nome, documento ou telefone..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (s: Supplier) => <span className="font-medium">{s.name}</span> },
          { header: 'Contato', render: (s: Supplier) => s.contact ?? '-' },
          { header: 'Telefone', render: (s: Supplier) => s.phone ?? '-' },
          { header: 'Email', render: (s: Supplier) => s.email ?? '-' },
          { header: 'Documento', render: (s: Supplier) => s.document ?? '-' },
        ]}
        data={data} loading={loading} emptyMessage="Nenhum fornecedor encontrado."
        onEdit={(s) => router.push(`/fornecedores/${s.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

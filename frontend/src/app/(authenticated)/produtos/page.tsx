'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProducts, deleteProduct } from '@/lib/products';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { Product } from '@/lib/products';

export default function ProdutosPage() {
  const router = useRouter();
  const [data, setData] = useState<Product[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchProducts({ page, limit: 10, search: search || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: Product) {
    if (!confirm(`Excluir produto "${item.name}"?`)) return;
    try { await deleteProduct(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/produtos/novo')}>Novo Produto</button>
      </div>
      <SearchBar placeholder="Buscar por nome ou código de barras..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (p: Product) => <span className="font-medium">{p.name}</span> },
          { header: 'Cód. Barras', render: (p: Product) => p.barcode ?? '-' },
          { header: 'Categoria', render: (p: Product) => p.category?.name ?? '-' },
          { header: 'Custo', render: (p: Product) => `R$ ${Number(p.costPrice).toFixed(2)}` },
          { header: 'Venda', render: (p: Product) => `R$ ${Number(p.salePrice).toFixed(2)}` },
        ]}
        data={data} loading={loading} emptyMessage="Nenhum produto encontrado."
        onEdit={(p) => router.push(`/produtos/${p.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

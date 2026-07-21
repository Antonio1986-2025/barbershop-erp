'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProducts, deleteProduct } from '@/lib/products';
import type { Product, ProductMeta } from '@/lib/products';

export default function ProdutosPage() {
  const router = useRouter();
  const [data, setData] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
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

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(1); load() }

  async function handleDelete(p: Product) {
    if (!confirm(`Excluir produto "${p.name}"?`)) return;
    try { await deleteProduct(p.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/produtos/novo')}>Novo Produto</button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input className="flex-1 rounded border px-3 py-1.5" placeholder="Buscar por nome ou código de barras..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white hover:bg-zinc-700">Buscar</button>
      </form>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? <p className="text-zinc-500">Carregando...</p> : data.length === 0 ? <p className="text-zinc-500">Nenhum produto encontrado.</p> : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-zinc-500">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Cód. Barras</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Custo</th>
                <th className="px-4 py-2">Venda</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">{p.barcode ?? '-'}</td>
                  <td className="px-4 py-2">{p.category?.name ?? '-'}</td>
                  <td className="px-4 py-2">R$ {Number(p.costPrice).toFixed(2)}</td>
                  <td className="px-4 py-2">R$ {Number(p.salePrice).toFixed(2)}</td>
                  <td className="space-x-2 px-4 py-2 text-right">
                    <button className="text-sm text-zinc-600 underline hover:text-zinc-900"
                      onClick={() => router.push(`/produtos/${p.id}`)}>Editar</button>
                    <button className="text-sm text-red-600 underline hover:text-red-800"
                      onClick={() => handleDelete(p)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1}
            onClick={() => setPage(page - 1)}>Anterior</button>
          <span className="text-zinc-600">Página {meta.page} de {meta.totalPages}</span>
          <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}

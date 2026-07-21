'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCustomers, deleteCustomer } from '@/lib/customers';
import type { Customer, CustomerMeta } from '@/lib/customers';

export default function ClientesPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<CustomerMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    fetchCustomers({ page, limit: 10, search: search || undefined })
      .then((res) => {
        setCustomers(res.data);
        setMeta(res.meta);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir cliente "${name}"?`)) return;
    try {
      await deleteCustomer(id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/clientes/novo')}
        >
          Novo Cliente
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          className="flex-1 rounded border px-3 py-1.5"
          placeholder="Buscar por nome, telefone ou documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white hover:bg-zinc-700"
        >
          Buscar
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Carregando...</p>
      ) : customers.length === 0 ? (
        <p className="text-zinc-500">Nenhum cliente encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-zinc-500">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Telefone</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Documento</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2">{c.phone ?? '-'}</td>
                  <td className="px-4 py-2">{c.email ?? '-'}</td>
                  <td className="px-4 py-2">{c.document ?? '-'}</td>
                  <td className="space-x-2 px-4 py-2 text-right">
                    <button
                      className="text-sm text-zinc-600 underline hover:text-zinc-900"
                      onClick={() => router.push(`/clientes/${c.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-sm text-red-600 underline hover:text-red-800"
                      onClick={() => handleDelete(c.id, c.name)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            className="rounded border px-3 py-1 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span className="text-zinc-600">
            Página {meta.page} de {meta.totalPages}
          </span>
          <button
            className="rounded border px-3 py-1 disabled:opacity-40"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

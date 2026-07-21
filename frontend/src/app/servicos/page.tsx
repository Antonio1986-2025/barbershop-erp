'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchServices, deleteService } from '@/lib/services';
import type { Service, ServiceMeta } from '@/lib/services';

export default function ServicosPage() {
  const router = useRouter();
  const [data, setData] = useState<Service[]>([]);
  const [meta, setMeta] = useState<ServiceMeta>({
    page: 1, limit: 10, total: 0, totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    fetchServices({ page, limit: 10, search: search || undefined })
      .then((res) => { setData(res.data); setMeta(res.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDelete(svc: Service) {
    if (!confirm(`Excluir serviço "${svc.name}"?`)) return;
    try {
      await deleteService(svc.id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <button
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/servicos/novo')}
        >
          Novo Serviço
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          className="flex-1 rounded border px-3 py-1.5"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white hover:bg-zinc-700">
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
      ) : data.length === 0 ? (
        <p className="text-zinc-500">Nenhum serviço encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-zinc-500">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Duração</th>
                <th className="px-4 py-2">Preço</th>
                <th className="px-4 py-2">Comissão</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2">{s.durationMinutes} min</td>
                  <td className="px-4 py-2">
                    R$ {Number(s.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    {s.commissionType
                      ? `${s.commissionType} ${s.commissionValue ?? ''}${s.commissionType === 'PERCENTAGE' ? '%' : ''}`
                      : '-'}
                  </td>
                  <td className="space-x-2 px-4 py-2 text-right">
                    <button
                      className="text-sm text-zinc-600 underline hover:text-zinc-900"
                      onClick={() => router.push(`/servicos/${s.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-sm text-red-600 underline hover:text-red-800"
                      onClick={() => handleDelete(s)}
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

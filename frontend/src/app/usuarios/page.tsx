'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUsers, deleteUser } from '@/lib/users';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { User } from '@/lib/users';

export default function UsuariosPage() {
  const router = useRouter();
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchUsers({ page, limit: 10, search: search || undefined })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleSearch() { setPage(1); load() }

  async function handleDelete(item: User) {
    if (!confirm(`Desativar usuário "${item.name}"?`)) return;
    try { await deleteUser(item.id); load() }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => router.push('/usuarios/novo')}>Novo Usuário</button>
      </div>
      <SearchBar placeholder="Buscar por nome ou email..." value={search}
        onChange={setSearch} onSearch={handleSearch} />
      <ErrorBox message={error} />
      <DataTable
        columns={[
          { header: 'Nome', render: (u: User) => <span className="font-medium">{u.name}</span> },
          { header: 'Email', render: (u: User) => u.email },
          { header: 'Roles', render: (u: User) => u.roles?.map((r) => r.role.name).join(', ') || '-' },
          { header: 'Ativo', render: (u: User) => u.active ? 'Sim' : 'Não' },
        ]}
        data={data} loading={loading} emptyMessage="Nenhum usuário encontrado."
        onEdit={(u) => router.push(`/usuarios/${u.id}`)}
        onDelete={handleDelete}
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

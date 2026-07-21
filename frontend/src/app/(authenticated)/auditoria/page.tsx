'use client';

import { useEffect, useState } from 'react';
import { fetchAuditLogs } from '@/lib/audit-logs';
import { DataTable } from '@/components/crud/data-table';
import { SearchBar } from '@/components/crud/search-bar';
import { Pagination } from '@/components/crud/pagination';
import { ErrorBox } from '@/components/crud/error-box';
import type { AuditLog } from '@/lib/audit-logs';

const actionLabels: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Exclusão',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

const actionColors: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  LOGIN: 'text-purple-600 bg-purple-50',
  LOGOUT: 'text-zinc-600 bg-zinc-50',
};

const entityLabels: Record<string, string> = {
  user: 'Usuário',
  company: 'Empresa',
  customer: 'Cliente',
  professional: 'Profissional',
  service: 'Serviço',
  category: 'Categoria',
  product: 'Produto',
};

function DetailsCell({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  try {
    const oldData = log.oldData ? JSON.parse(log.oldData) : null;
    const newData = log.newData ? JSON.parse(log.newData) : null;
    const hasDetails = oldData || newData;

    return (
      <div>
        <button
          className="text-xs text-zinc-400 underline hover:text-zinc-600"
          onClick={() => setOpen(!open)}
        >
          {hasDetails ? (open ? 'Ocultar' : 'Detalhes') : '-'}
        </button>
        {open && (oldData || newData) && (
          <div className="mt-2 max-h-48 overflow-auto rounded border bg-zinc-50 p-2 text-xs">
            {oldData && (
              <div className="mb-2">
                <p className="font-semibold text-red-600">Anterior</p>
                <pre className="whitespace-pre-wrap">{JSON.stringify(oldData, null, 2)}</pre>
              </div>
            )}
            {newData && (
              <div>
                <p className="font-semibold text-green-600">Novo</p>
                <pre className="whitespace-pre-wrap">{JSON.stringify(newData, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  } catch {
    return <span className="text-xs text-zinc-400">-</span>;
  }
}

export default function AuditoriaPage() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchAuditLogs({
      page, limit: 10,
      entity: entity || undefined,
      action: action || undefined,
    })
      .then((r) => { setData(r.data); setMeta(r.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [page]);

  function handleFilter() { setPage(1); load() }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Auditoria</h1>
      <p className="text-sm text-zinc-500">Registro de ações realizadas no sistema.</p>

      <ErrorBox message={error} />

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Entidade</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(entityLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Ação</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(actionLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white hover:bg-zinc-700"
          onClick={handleFilter}
        >
          Filtrar
        </button>
      </div>

      <DataTable
        columns={[
          { header: 'Data', render: (l: AuditLog) => new Date(l.createdAt).toLocaleString() },
          {
            header: 'Usuário',
            render: (l: AuditLog) => <span>{l.user.name}<br /><span className="text-xs text-zinc-400">{l.user.email}</span></span>,
          },
          {
            header: 'Ação',
            render: (l: AuditLog) => (
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${actionColors[l.action] || ''}`}>
                {actionLabels[l.action] || l.action}
              </span>
            ),
          },
          {
            header: 'Entidade',
            render: (l: AuditLog) => <span className="text-sm">{entityLabels[l.entity] || l.entity}</span>,
          },
          { header: 'ID', render: (l: AuditLog) => <span className="text-xs text-zinc-400">{l.entityId ?? '-'}</span> },
          { header: 'Detalhes', render: (l: AuditLog) => <DetailsCell log={l} /> },
        ]}
        data={data}
        loading={loading}
        emptyMessage="Nenhum log encontrado."
      />
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

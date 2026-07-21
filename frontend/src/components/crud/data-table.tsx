import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  emptyMessage: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  if (loading) return <p className="text-zinc-500">Carregando...</p>;
  if (data.length === 0) return <p className="text-zinc-500">{emptyMessage}</p>;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-zinc-50 text-zinc-500">
            {columns.map((col, i) => (
              <th key={i} className={`px-4 py-2 ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-4 py-2 text-right">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="border-b hover:bg-zinc-50">
              {columns.map((col, i) => (
                <td key={i} className={`px-4 py-2 ${col.className ?? ''}`}>
                  {col.render(item)}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="space-x-2 px-4 py-2 text-right">
                  {onEdit && (
                    <button
                      className="text-sm text-zinc-600 underline hover:text-zinc-900"
                      onClick={() => onEdit(item)}
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="text-sm text-red-600 underline hover:text-red-800"
                      onClick={() => onDelete(item)}
                    >
                      Excluir
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

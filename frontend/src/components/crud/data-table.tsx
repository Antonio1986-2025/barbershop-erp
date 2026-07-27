import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
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
  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    );
  if (data.length === 0)
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );

  return (
    <>
      {/* Card view for mobile */}
      <div className="space-y-3 sm:hidden">
        {data.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-border bg-card-bg p-4 animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
            {columns.map((col, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-xs font-medium text-muted-foreground">{col.header}</span>
                <span className="text-sm text-right ml-2">{col.render(item)}</span>
              </div>
            ))}
            {(onEdit || onDelete) && (
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                {onEdit && (
                  <button
                    className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-light transition-colors"
                    onClick={() => onEdit(item)}
                  >
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    className="flex-1 rounded-md border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger hover:text-white transition-colors"
                    onClick={() => onDelete(item)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table view for desktop */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-muted-foreground">
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 font-medium ${col.className ?? ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                {columns.map((col, i) => (
                  <td key={i} data-label={col.header} className={`px-4 py-3 ${col.className ?? ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                    {col.render(item)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => onEdit(item)}
                        >
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="rounded-md bg-danger/10 px-3 py-1 text-xs font-medium text-danger hover:bg-danger hover:text-white transition-colors"
                          onClick={() => onDelete(item)}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

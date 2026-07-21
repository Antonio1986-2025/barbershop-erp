interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <button
        className="rounded border px-3 py-1 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>
      <span className="text-zinc-600">
        Página {page} de {totalPages}
      </span>
      <button
        className="rounded border px-3 py-1 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
      </button>
    </div>
  );
}

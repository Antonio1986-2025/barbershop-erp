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
        className="rounded-md border border-border bg-card-bg px-3 py-1.5 text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>

      {/* Page numbers - show on sm+ */}
      <div className="hidden sm:flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => (
            <span key={p} className="flex items-center">
              {idx > 0 && arr[idx - 1] !== p - 1 && (
                <span className="px-1 text-muted-foreground">...</span>
              )}
              <button
                className={`min-w-[32px] rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </span>
          ))}
      </div>

      <span className="text-muted-foreground sm:hidden">
        {page} / {totalPages}
      </span>

      <button
        className="rounded-md border border-border bg-card-bg px-3 py-1.5 text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
      </button>
    </div>
  );
}

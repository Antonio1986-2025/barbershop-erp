'use client';

import { useRouter } from 'next/navigation';

export function FormActions({
  backTo,
  saving,
}: {
  backTo: string;
  saving: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:gap-3">
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-all sm:w-auto"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Salvando...
          </span>
        ) : 'Salvar'}
      </button>
      <button
        type="button"
        className="w-full rounded-md border border-border bg-card-bg px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors sm:w-auto"
        onClick={() => router.push(backTo)}
      >
        Cancelar
      </button>
    </div>
  );
}

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
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
      <button
        type="button"
        className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
        onClick={() => router.push(backTo)}
      >
        Cancelar
      </button>
    </div>
  );
}

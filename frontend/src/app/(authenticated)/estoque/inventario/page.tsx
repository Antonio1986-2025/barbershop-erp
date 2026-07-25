'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUnits } from '@/lib/units';
import { ErrorBox } from '@/components/crud/error-box';
import type { Unit } from '@/lib/units';

export default function InventarioPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Inventário</h1>
        <p className="text-sm text-muted-foreground"><a href="/estoque" className="hover:underline">Estoque</a> / Inventário</p>
      </div>

      <ErrorBox message={error} />

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        O inventário de estoque ainda não possui interface dedicada.
        Utilize a página de <a href="/estoque/movimentacoes" className="underline">Movimentações</a> para ajustar manualmente o estoque,
        ou os <a href="/estoque/relatorios" className="underline">Relatórios</a> para consultar o saldo atual.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button className="rounded-lg border bg-white p-6 text-left hover:bg-zinc-50"
          onClick={() => router.push('/estoque/movimentacoes')}>
          <p className="font-medium">Ajustar Estoque</p>
          <p className="mt-1 text-xs text-zinc-500">Fazer ajuste manual de entrada ou saída</p>
        </button>
        <button className="rounded-lg border bg-white p-6 text-left hover:bg-zinc-50"
          onClick={() => router.push('/compras/novo')}>
          <p className="font-medium">Nova Compra</p>
          <p className="mt-1 text-xs text-zinc-500">Registrar entrada por compra</p>
        </button>
      </div>
    </div>
  );
}

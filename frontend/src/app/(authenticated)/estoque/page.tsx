'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDashboardCards, fetchDashboardAlerts, fetchDashboardCharts, fetchDashboardRankings } from '@/lib/stock';
import { ErrorBox } from '@/components/crud/error-box';

export default function EstoquePage() {
  const router = useRouter();
  const [cards, setCards] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    Promise.all([
      fetchDashboardCards().then(setCards).catch(() => {}),
      fetchDashboardAlerts().then(setAlerts).catch(() => {}),
      fetchDashboardCharts().then(setCharts).catch(() => {}),
    ]).catch(e => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load() }, []);

  const links = [
    { href: '/estoque/movimentacoes', label: 'Movimentações', desc: 'Histórico de entradas e saídas' },
    { href: '/estoque/alertas', label: 'Alertas', desc: 'Produtos com estoque baixo ou zerado', badge: cards?.openAlerts },
    { href: '/estoque/relatorios', label: 'Relatórios', desc: 'Kardex, giro, valuation' },
    { href: '/estoque/inventario', label: 'Inventário', desc: 'Contagem física de estoque' },
    { href: '/compras', label: 'Compras', desc: 'Pedidos de compra' },
    { href: '/fornecedores', label: 'Fornecedores', desc: 'Cadastro de fornecedores' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <h1 className="text-xl font-bold sm:text-2xl">Estoque</h1>
      <ErrorBox message={error} />

      {loading ? <p className="text-muted-foreground animate-pulse">Carregando...</p> : (
        <>
          {cards && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-zinc-500">Valor em Estoque</p>
                <p className="text-lg font-bold">R$ {cards.totalValue?.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-zinc-500">Produtos</p>
                <p className="text-lg font-bold">{cards.totalProducts}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-red-500">Estoque Baixo</p>
                <p className="text-lg font-bold text-red-600">{cards.lowStock}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-red-500">Zerados</p>
                <p className="text-lg font-bold text-red-600">{cards.zeroStock}</p>
              </div>
              <div className="rounded-lg border bg-zinc-50 p-4">
                <p className="text-xs text-zinc-500">Alertas Abertos</p>
                <p className="text-lg font-bold">{cards.openAlerts}</p>
              </div>
              <div className="rounded-lg border bg-zinc-50 p-4">
                <p className="text-xs text-zinc-500">Compras no Mês</p>
                <p className="text-lg font-bold">R$ {cards.monthlyPurchases?.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-zinc-50 p-4">
                <p className="text-xs text-zinc-500">Giro Médio</p>
                <p className="text-lg font-bold">{cards.avgTurnover?.toFixed(1)}x</p>
              </div>
              <div className="rounded-lg border bg-zinc-50 p-4">
                <p className="text-xs text-zinc-500">Em Trânsito</p>
                <p className="text-lg font-bold">{cards.inTransit}</p>
              </div>
            </div>
          )}

          {alerts?.recent?.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-zinc-600">Alertas Recentes</h2>
              <div className="space-y-2">
                {alerts.recent.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <div>
                      <p className="text-sm font-medium">{a.product?.name}</p>
                      <p className="text-xs text-yellow-700">{a.message}</p>
                    </div>
                    <span className="text-xs text-zinc-500">{a.unit?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map(link => (
              <button key={link.href} className="rounded-lg border bg-white p-4 text-left hover:bg-zinc-50 transition-colors"
                onClick={() => router.push(link.href)}>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{link.label}</p>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">{link.badge}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">{link.desc}</p>
              </button>
            ))}
          </div>

          {charts?.topProducts && (
            <div className="rounded-lg border">
              <div className="border-b bg-zinc-50 px-4 py-2">
                <h2 className="text-sm font-semibold text-zinc-600">Top 10 Produtos</h2>
              </div>
              <div className="divide-y text-sm">
                {charts.topProducts.map((p: any, i: number) => (
                  <div key={p.productId} className="flex items-center justify-between px-4 py-2">
                    <span><span className="text-zinc-400 mr-2">#{i + 1}</span>{p.productName}</span>
                    <span className="font-medium">{p.totalVolume} unidades</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

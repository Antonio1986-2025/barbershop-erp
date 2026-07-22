'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchUnits } from '@/lib/units';
import { useDashboardOverview, useDashboardRevenueChart, useDashboardTopServices, useDashboardProfessionalsRanking, useDashboardOccupancy, useDashboardFinancialAnalysis, useDashboardStockAnalysis, useDashboardAlerts, useDashboardSummary, useDashboardFinancial, useDashboardOperations, useDashboardProfessionals, useDashboardServices, useDashboardStock } from '@/hooks/use-dashboard';

const RevenueBarChart = dynamic(() => import('@/components/dashboard/dashboard-charts').then(m => m.RevenueBarChart), { ssr: false });
const OccupancyPieChart = dynamic(() => import('@/components/dashboard/dashboard-charts').then(m => m.OccupancyPieChart), { ssr: false });
const ServicesBarChart = dynamic(() => import('@/components/dashboard/dashboard-charts').then(m => m.ServicesBarChart), { ssr: false });
const FinancialPieChart = dynamic(() => import('@/components/dashboard/dashboard-charts').then(m => m.FinancialPieChart), { ssr: false });

function monthStart() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
function today() { return new Date().toISOString().slice(0, 10) }

export default function DashboardPage() {
  const [unitId, setUnitId] = useState('');
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [units, setUnits] = useState<any[]>([]);

  const filter = { unitId: unitId || undefined, startDate, endDate };
  const filterLight = { unitId: unitId || undefined };

  const { data: overview } = useDashboardOverview(filter);
  const { data: revenueChart } = useDashboardRevenueChart(filter);
  const { data: topServices } = useDashboardTopServices(filter);
  const { data: profRanking } = useDashboardProfessionalsRanking(filter);
  const { data: occupancy } = useDashboardOccupancy(filter);
  const { data: finAnalysis } = useDashboardFinancialAnalysis(filter);
  const { data: stockAnalysis } = useDashboardStockAnalysis(filter);
  const { data: alerts } = useDashboardAlerts(filterLight);
  const { data: summary } = useDashboardSummary(filter);
  const { data: financial } = useDashboardFinancial(filter);
  const { data: operations } = useDashboardOperations(filter);
  const { data: professionals } = useDashboardProfessionals(filter);
  const { data: services } = useDashboardServices(filter);
  const { data: stockLegacy } = useDashboardStock(filter);

  useEffect(() => { fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {}) }, []);

  if (!overview && !summary) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Unidade</label>
          <select className="rounded border px-3 py-1.5 text-sm" value={unitId} onChange={e => setUnitId(e.target.value)}>
            <option value="">Todas</option>
            {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Início</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Fim</label>
          <input type="date" className="rounded border px-3 py-1.5 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a: any, i: number) => (
            <div key={i} className={`rounded-lg border p-3 text-sm ${
              a.severity === 'critical' ? 'border-red-300 bg-red-50 text-red-700' : 'border-yellow-300 bg-yellow-50 text-yellow-700'
            }`}>
              <span className="font-medium">{a.type}:</span> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Faturamento" value={`R$ ${overview.revenueTotal.toFixed(2)}`}
            sub={overview.revenueGrowth >= 0 ? `+${overview.revenueGrowth}%` : `${overview.revenueGrowth}%`}
            positive={overview.revenueGrowth >= 0} />
          <MetricCard label="Atendimentos" value={overview.appointmentsTotal}
            sub={`${overview.completedAppointments} concluídos`} />
          <MetricCard label="Cancelamento" value={`${overview.cancellationRate}%`} />
          <MetricCard label="Ticket Médio" value={`R$ ${overview.averageTicket.toFixed(2)}`} />
          <MetricCard label="Clientes Ativos" value={overview.activeCustomers}
            sub={`+${overview.newCustomers} novos`} />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {revenueChart && <RevenueBarChart data={revenueChart} />}
        {occupancy && <OccupancyPieChart data={occupancy} />}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {profRanking && profRanking.length > 0 && (
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Ranking de Profissionais</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-zinc-500">
                    <th className="py-1 pr-4">Nome</th>
                    <th className="py-1 pr-4">Atend.</th>
                    <th className="py-1 pr-4">Receita</th>
                    <th className="py-1">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {profRanking.map((p: any) => (
                    <tr key={p.professionalId} className="border-b">
                      <td className="py-1 pr-4 font-medium">{p.name}</td>
                      <td className="py-1 pr-4">{p.completed}</td>
                      <td className="py-1 pr-4">R$ {p.revenue.toFixed(2)}</td>
                      <td className="py-1">R$ {p.averageTicket.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {topServices && <ServicesBarChart data={topServices} />}
      </div>

      {/* Financial + Stock Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {finAnalysis && (
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Análise Financeira</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Receita</p>
                <p className="text-lg font-bold text-green-600">R$ {finAnalysis.revenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Despesas</p>
                <p className="text-lg font-bold text-red-600">R$ {finAnalysis.expenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Lucro</p>
                <p className={`text-lg font-bold ${finAnalysis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {finAnalysis.profit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Saldo Caixa</p>
                <p className={`text-lg font-bold ${finAnalysis.cashBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  R$ {finAnalysis.cashBalance.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">A Receber</p>
                <p className="text-lg font-bold">R$ {finAnalysis.receivables.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">A Pagar</p>
                <p className="text-lg font-bold">R$ {finAnalysis.payables.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
        {stockAnalysis && (
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Análise de Estoque</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Total Produtos</p>
                <p className="text-lg font-bold">{stockAnalysis.totalProducts}</p>
              </div>
              <div>
                <p className="text-zinc-500">Estoque Baixo</p>
                <p className="text-lg font-bold text-red-600">{stockAnalysis.lowStockCount}</p>
              </div>
              <div>
                <p className="text-zinc-500">Valor Estoque</p>
                <p className="text-lg font-bold">R$ {stockAnalysis.stockValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Produtos em Movimento</p>
                <p className="text-lg font-bold">{stockAnalysis.topMovements}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legacy sections */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <MetricCard label="Faturamento (legado)" value={`R$ ${summary.revenue.toFixed(2)}`} />
          <MetricCard label="Atendimentos" value={summary.appointments} />
          <MetricCard label="Concluídos" value={summary.completedServices} />
          <MetricCard label="Ticket Médio" value={`R$ ${summary.averageTicket.toFixed(2)}`} />
          <MetricCard label="Clientes" value={summary.customers} />
        </div>
      )}

      {financial && (
        <Section title="Financeiro (detalhado)">
          <div className="flex gap-6 text-sm mb-4">
            <span>Entradas: <strong>R$ {financial.entries.toFixed(2)}</strong></span>
            <span>Saídas: <strong>R$ {financial.exits.toFixed(2)}</strong></span>
            <span>Saldo: <strong className={financial.balance >= 0 ? 'text-green-600' : 'text-red-600'}>R$ {financial.balance.toFixed(2)}</strong></span>
          </div>
          <FinancialPieChart data={financial.payments} />
        </Section>
      )}

      {operations && (
        <Section title="Operacional">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-600">Agendamentos</h3>
              <StatusTable items={operations.appointments} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-600">Ordens de Serviço</h3>
              <StatusTable items={operations.serviceOrders} />
            </div>
          </div>
        </Section>
      )}

      {professionals && professionals.length > 0 && (
        <Section title="Profissionais (completo)">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-zinc-500"><th className="py-1 pr-4">Nome</th><th className="py-1 pr-4">Atend.</th><th className="py-1">Faturamento</th></tr></thead>
            <tbody>{professionals.map((p: any) => (
              <tr key={p.professionalId} className="border-b">
                <td className="py-1 pr-4 font-medium">{p.name}</td>
                <td className="py-1 pr-4">{p.appointments}</td>
                <td className="py-1">R$ {p.revenue.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </Section>
      )}

      {services && services.length > 0 && (
        <Section title="Serviços (completo)">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-zinc-500"><th className="py-1 pr-4">Serviço</th><th className="py-1 pr-4">Qtd</th><th className="py-1 pr-4">Receita</th><th className="py-1">Pedidos</th></tr></thead>
            <tbody>{services.map((s: any) => (
              <tr key={s.serviceId} className="border-b">
                <td className="py-1 pr-4 font-medium">{s.name}</td>
                <td className="py-1 pr-4">{s.quantity}</td>
                <td className="py-1 pr-4">R$ {s.revenue.toFixed(2)}</td>
                <td className="py-1">{s.orders}</td>
              </tr>
            ))}</tbody>
          </table>
        </Section>
      )}

      {stockLegacy && (
        <Section title="Estoque (completo)">
          <div className="flex gap-6 text-sm mb-4">
            <span>Total: <strong>{stockLegacy.totalProducts}</strong></span>
            <span>Qtd: <strong>{stockLegacy.totalQuantity}</strong></span>
            <span>Mov.: <strong>{stockLegacy.movements}</strong></span>
          </div>
          {stockLegacy.criticalProducts && stockLegacy.criticalProducts.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-red-600">Produtos com estoque zerado</h3>
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b text-zinc-500"><th className="py-1 pr-4">Produto</th><th className="py-1">Qtd</th></tr></thead>
                <tbody>{stockLegacy.criticalProducts.map((p: any) => (
                  <tr key={p.name} className="border-b"><td className="py-1 pr-4">{p.name}</td><td className="py-1">{p.quantity}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, positive }: { label: string; value: string | number; sub?: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {sub && <p className={`text-xs ${positive !== undefined ? (positive ? 'text-green-600' : 'text-red-600') : 'text-zinc-400'}`}>{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border p-4"><h2 className="mb-4 text-lg font-semibold">{title}</h2>{children}</div>;
}

function StatusTable({ items }: { items: { status: string; count: number }[] }) {
  return !items || items.length === 0 ? <p className="text-sm text-zinc-400">Nenhum registro</p> : (
    <table className="w-full text-left text-sm">
      <thead><tr className="border-b text-zinc-500"><th className="py-1 pr-4">Status</th><th className="py-1">Qtd</th></tr></thead>
      <tbody>{items.map((i: any) => (
        <tr key={i.status} className="border-b"><td className="py-1 pr-4">{i.status}</td><td className="py-1">{i.count}</td></tr>
      ))}</tbody>
    </table>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchSummary,
  fetchFinancial,
  fetchOperations,
  fetchProfessionals,
  fetchServices,
  fetchStock,
} from '@/lib/dashboard';
import type {
  DashboardFilter,
  SummaryData,
  FinancialData,
  OperationsData,
  ProfessionalData,
  ServiceData,
  StockData,
} from '@/types/dashboard';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<DashboardFilter>({
    companyId: '',
    unitId: '',
    startDate: monthStart(),
    endDate: today(),
  });

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [operations, setOperations] = useState<OperationsData | null>(null);
  const [professionals, setProfessionals] = useState<ProfessionalData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!filter.companyId) return;
    setLoading(true);
    setError('');
    try {
      const [s, f, o, p, sv, st] = await Promise.all([
        fetchSummary(filter),
        fetchFinancial(filter),
        fetchOperations(filter),
        fetchProfessionals(filter),
        fetchServices(filter),
        fetchStock(filter),
      ]);
      setSummary(s);
      setFinancial(f);
      setOperations(o);
      setProfessionals(p);
      setServices(sv);
      setStock(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <Filters filter={filter} onChange={setFilter} onSearch={load} />

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && !summary && (
        <p className="text-zinc-500">Carregando...</p>
      )}

      {summary && <SummaryCards data={summary} />}
      {financial && <FinancialPanel data={financial} />}
      {operations && <OperationsPanel data={operations} />}
      {professionals.length > 0 && <ProfessionalsTable data={professionals} />}
      {services.length > 0 && <ServicesTable data={services} />}
      {stock && <StockPanel data={stock} />}

      {!filter.companyId && (
        <p className="text-zinc-500">
          Informe o ID da empresa para carregar os dados.
        </p>
      )}
    </div>
  );
}

function Filters({
  filter,
  onChange,
  onSearch,
}: {
  filter: DashboardFilter;
  onChange: (f: DashboardFilter) => void;
  onSearch: () => void;
}) {
  const set = (field: keyof DashboardFilter, value: string) =>
    onChange({ ...filter, [field]: value });

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
      <Field label="Empresa">
        <input
          className="rounded border px-3 py-1.5"
          placeholder="ID da empresa"
          value={filter.companyId}
          onChange={(e) => set('companyId', e.target.value)}
        />
      </Field>
      <Field label="Unidade (opcional)">
        <input
          className="rounded border px-3 py-1.5"
          placeholder="ID da unidade"
          value={filter.unitId ?? ''}
          onChange={(e) => set('unitId', e.target.value)}
        />
      </Field>
      <Field label="Início">
        <input
          type="date"
          className="rounded border px-3 py-1.5"
          value={filter.startDate}
          onChange={(e) => set('startDate', e.target.value)}
        />
      </Field>
      <Field label="Fim">
        <input
          type="date"
          className="rounded border px-3 py-1.5"
          value={filter.endDate}
          onChange={(e) => set('endDate', e.target.value)}
        />
      </Field>
      <button
        className="rounded bg-zinc-900 px-4 py-1.5 text-white hover:bg-zinc-700"
        onClick={onSearch}
      >
        Filtrar
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function SummaryCards({ data }: { data: SummaryData }) {
  const cards = [
    { label: 'Faturamento', value: `R$ ${data.revenue.toFixed(2)}` },
    { label: 'Atendimentos', value: data.appointments },
    { label: 'Concluídos', value: data.completedServices },
    { label: 'Ticket Médio', value: `R$ ${data.averageTicket.toFixed(2)}` },
    { label: 'Clientes', value: data.customers },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border p-4 text-center">
          <p className="text-sm text-zinc-500">{c.label}</p>
          <p className="mt-1 text-xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function FinancialPanel({ data }: { data: FinancialData }) {
  return (
    <Section title="Financeiro">
      {data.payments.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-600">
            Recebimentos por forma de pagamento
          </h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-500">
                <th className="py-1 pr-4">Forma</th>
                <th className="py-1 pr-4">Valor</th>
                <th className="py-1">Qtd</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.method} className="border-b">
                  <td className="py-1 pr-4">{p.method}</td>
                  <td className="py-1 pr-4">R$ {p.amount.toFixed(2)}</td>
                  <td className="py-1">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-6 text-sm">
        <span>
          Entradas: <strong>R$ {data.entries.toFixed(2)}</strong>
        </span>
        <span>
          Saídas: <strong>R$ {data.exits.toFixed(2)}</strong>
        </span>
        <span>
          Saldo:{' '}
          <strong className={data.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
            R$ {data.balance.toFixed(2)}
          </strong>
        </span>
      </div>
    </Section>
  );
}

function OperationsPanel({ data }: { data: OperationsData }) {
  return (
    <Section title="Operacional">
      <div className="grid gap-6 md:grid-cols-2">
        <StatusTable title="Agendamentos" items={data.appointments} />
        <StatusTable title="Ordens de Serviço" items={data.serviceOrders} />
      </div>
    </Section>
  );
}

function StatusTable({
  title,
  items,
}: {
  title: string;
  items: { status: string; count: number }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-zinc-600">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhum registro</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-zinc-500">
              <th className="py-1 pr-4">Status</th>
              <th className="py-1">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.status} className="border-b">
                <td className="py-1 pr-4">{i.status}</td>
                <td className="py-1">{i.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProfessionalsTable({ data }: { data: ProfessionalData[] }) {
  return (
    <Section title="Profissionais">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-zinc-500">
              <th className="py-1 pr-4">Nome</th>
              <th className="py-1 pr-4">Atendimentos</th>
              <th className="py-1">Faturamento</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.professionalId} className="border-b">
                <td className="py-1 pr-4 font-medium">{p.name}</td>
                <td className="py-1 pr-4">{p.appointments}</td>
                <td className="py-1">R$ {p.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function ServicesTable({ data }: { data: ServiceData[] }) {
  return (
    <Section title="Serviços">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-zinc-500">
              <th className="py-1 pr-4">Serviço</th>
              <th className="py-1 pr-4">Quantidade</th>
              <th className="py-1 pr-4">Receita</th>
              <th className="py-1">Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.serviceId} className="border-b">
                <td className="py-1 pr-4 font-medium">{s.name}</td>
                <td className="py-1 pr-4">{s.quantity}</td>
                <td className="py-1 pr-4">R$ {s.revenue.toFixed(2)}</td>
                <td className="py-1">{s.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function StockPanel({ data }: { data: StockData }) {
  return (
    <Section title="Estoque">
      <div className="mb-4 flex gap-6 text-sm">
        <span>
          Total de produtos: <strong>{data.totalProducts}</strong>
        </span>
        <span>
          Quantidade total: <strong>{data.totalQuantity}</strong>
        </span>
        <span>
          Movimentações: <strong>{data.movements}</strong>
        </span>
      </div>
      {data.criticalProducts.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-red-600">
            Produtos com estoque zerado
          </h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-zinc-500">
                <th className="py-1 pr-4">Produto</th>
                <th className="py-1">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {data.criticalProducts.map((p) => (
                <tr key={p.name} className="border-b">
                  <td className="py-1 pr-4">{p.name}</td>
                  <td className="py-1">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

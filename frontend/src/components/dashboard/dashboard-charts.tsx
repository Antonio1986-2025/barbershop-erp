'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export function RevenueBarChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">Receita por Período</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="revenue" fill="#2563eb" name="Receita" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OccupancyPieChart({ data }: { data: { occupiedSlots: number; availableSlots: number; totalSlots: number; occupancyPercentage: number } }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">Ocupação da Agenda</h2>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={[
              { name: 'Ocupado', value: data.occupiedSlots },
              { name: 'Disponível', value: data.availableSlots },
            ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
              {[0, 1].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm text-zinc-600">
        Ocupação: <strong>{data.occupancyPercentage}%</strong>
        &nbsp;({data.occupiedSlots}/{data.totalSlots} vagas)
      </p>
    </div>
  );
}

export function ServicesBarChart({ data }: { data: { name: string; quantity: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-lg font-semibold">Serviços mais Vendidos</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="quantity" fill="#059669" name="Quantidade" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FinancialPieChart({ data }: { data: { method: string; amount: number }[] }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data.map((p) => ({ name: p.method, value: p.amount }))}
          cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

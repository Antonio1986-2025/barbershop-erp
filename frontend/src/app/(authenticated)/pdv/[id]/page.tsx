'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchSale, fetchPayments, cancelSale, refundSale, SALE_STATUS_LABELS, SALE_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/sales';
import { ErrorBox } from '@/components/crud/error-box';
import type { Sale, Payment } from '@/lib/sales';

export default function DetalheVendaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [reason, setReason] = useState('');

  function load() {
    setLoading(true); setError('');
    Promise.all([
      fetchSale(id).then(setSale),
      fetchPayments(id).then(setPayments).catch(() => {}),
    ]).catch(e => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [id]);

  async function handleCancel() {
    setActionLoading(true); setError('');
    try {
      await cancelSale(id, reason || undefined);
      setShowCancelForm(false); setReason(''); load();
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  async function handleRefund() {
    setActionLoading(true); setError('');
    try {
      await refundSale(id, reason || undefined);
      setShowRefundForm(false); setReason(''); load();
    } catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  if (loading) return <div className="mx-auto max-w-3xl p-6"><p className="text-zinc-500">Carregando...</p></div>;

  if (!sale) return <div className="mx-auto max-w-3xl p-6"><p className="text-red-600">Venda não encontrada.</p></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detalhes da Venda</h1>
          <p className="text-sm text-zinc-500">ID: {sale.id}</p>
        </div>
        <button className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
          onClick={() => router.push('/pdv')}>Voltar</button>
      </div>

      <ErrorBox message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-zinc-500 mb-1">Status</p>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${SALE_STATUS_COLORS[sale.status] ?? ''}`}>
            {SALE_STATUS_LABELS[sale.status] ?? sale.status}
          </span>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-zinc-500 mb-1">Total</p>
          <p className="text-xl font-bold">R$ {Number(sale.total).toFixed(2)}</p>
        </div>
        {sale.customer && (
          <div className="rounded-lg border p-4">
            <p className="text-xs text-zinc-500 mb-1">Cliente</p>
            <p className="font-medium">{sale.customer.name}</p>
            {sale.customer.phone && <p className="text-xs text-zinc-500">{sale.customer.phone}</p>}
          </div>
        )}
        {sale.unit && (
          <div className="rounded-lg border p-4">
            <p className="text-xs text-zinc-500 mb-1">Unidade</p>
            <p className="font-medium">{sale.unit.name}</p>
          </div>
        )}
        <div className="rounded-lg border p-4">
          <p className="text-xs text-zinc-500 mb-1">Criada em</p>
          <p className="text-sm">{new Date(sale.createdAt).toLocaleString('pt-BR')}</p>
        </div>
        {sale.cancelledAt && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs text-red-600 mb-1">Cancelada em</p>
            <p className="text-sm text-red-700">{new Date(sale.cancelledAt).toLocaleString('pt-BR')}</p>
            {sale.cancelledReason && <p className="text-xs text-red-600 mt-1">Motivo: {sale.cancelledReason}</p>}
          </div>
        )}
        {sale.refundedAt && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs text-orange-600 mb-1">Reembolsada em</p>
            <p className="text-sm text-orange-700">{new Date(sale.refundedAt).toLocaleString('pt-BR')}</p>
            {sale.refundReason && <p className="text-xs text-orange-600 mt-1">Motivo: {sale.refundReason}</p>}
          </div>
        )}
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-zinc-50 px-4 py-2">
          <h2 className="text-sm font-semibold text-zinc-600">Itens da Venda</h2>
        </div>
        <div className="divide-y">
          {sale.items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.productName || item.serviceName || 'Item'}</p>
                <p className="text-xs text-zinc-500">
                  {item.productId ? 'Produto' : 'Serviço'} • Qtd: {item.quantity > 1 ? item.quantity : ''}
                  {item.quantity > 1 ? '' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">R$ {Number(item.totalPrice).toFixed(2)}</p>
                {item.quantity > 1 && (
                  <p className="text-xs text-zinc-500">R$ {Number(item.unitPrice).toFixed(2)} un.</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t bg-zinc-50 px-4 py-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>R$ {Number(sale.subtotal).toFixed(2)}</span>
          </div>
          {Number(sale.discountAmount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>- R$ {Number(sale.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold mt-1">
            <span>Total</span>
            <span>R$ {Number(sale.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b bg-zinc-50 px-4 py-2">
            <h2 className="text-sm font-semibold text-zinc-600">Pagamentos</h2>
          </div>
          <div className="divide-y">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</p>
                  <p className="text-xs text-zinc-500">{new Date(p.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <p className="text-sm font-semibold text-green-600">R$ {Number(p.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {(sale.status === 'DRAFT' || sale.status === 'OPEN' || sale.status === 'PAID') && (
          <button className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            onClick={() => { setShowCancelForm(true); setReason('') }}>
            Cancelar Venda
          </button>
        )}
        {sale.status === 'PAID' && (
          <button className="rounded border border-orange-300 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
            onClick={() => { setShowRefundForm(true); setReason('') }}>
            Reembolsar Venda
          </button>
        )}
      </div>

      {showCancelForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Cancelar Venda</h3>
            <p className="mb-4 text-sm text-zinc-600">Tem certeza que deseja cancelar esta venda?</p>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Motivo (opcional)</label>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={3} value={reason}
              onChange={e => setReason(e.target.value)} placeholder="Ex: Cliente desistiu" />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowCancelForm(false)}>Voltar</button>
              <button className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                disabled={actionLoading} onClick={handleCancel}>
                {actionLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Reembolsar Venda</h3>
            <p className="mb-4 text-sm text-zinc-600">Isso reembolsará R$ {Number(sale.total).toFixed(2)} ao cliente.</p>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Motivo (opcional)</label>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={3} value={reason}
              onChange={e => setReason(e.target.value)} placeholder="Ex: Serviço não realizado" />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowRefundForm(false)}>Voltar</button>
              <button className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
                disabled={actionLoading} onClick={handleRefund}>
                {actionLoading ? 'Reembolsando...' : 'Confirmar Reembolso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

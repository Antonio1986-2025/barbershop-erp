'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchPurchase, confirmPurchase, cancelPurchase, PURCHASE_STATUS_LABELS, PURCHASE_STATUS_COLORS } from '@/lib/purchases';
import type { Purchase } from '@/lib/purchases';
import { ErrorBox } from '@/components/crud/error-box';
import { useToast } from '@/components/ui/toast';

export default function DetalheCompraPage() {
  const params = useParams(); const router = useRouter();
  const { addToast } = useToast();
  const id = params.id as string;
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  function load() {
    setLoading(true); setError('');
    fetchPurchase(id).then(setPurchase).catch(e => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load() }, [id]);

  async function handleConfirm() {
    if (window.confirm('Confirmar esta compra? O estoque será atualizado.')) { addToast('SUCCESS', 'Compra confirmada'); }
    setActionLoading(true); setError('');
    try { await confirmPurchase(id); load() }
    catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  async function handleCancel() {
    setActionLoading(true); setError('');
    try { await cancelPurchase(id, cancelReason || undefined); setShowCancelForm(false); load() }
    catch (e: any) { setError(e.message) }
    finally { setActionLoading(false) }
  }

  if (loading) return <div className="mx-auto max-w-3xl p-6"><p className="text-zinc-500">Carregando...</p></div>;
  if (!purchase) return <div className="mx-auto max-w-3xl p-6"><p className="text-red-600">Compra não encontrada.</p></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detalhes da Compra</h1>
          <p className="text-sm text-zinc-500">ID: {purchase.id}</p>
        </div>
        <button className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
          onClick={() => router.push('/compras')}>Voltar</button>
      </div>

      <ErrorBox message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-zinc-500">Status</p>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${PURCHASE_STATUS_COLORS[purchase.status] ?? ''}`}>
            {PURCHASE_STATUS_LABELS[purchase.status] ?? purchase.status}
          </span>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-xl font-bold">R$ {Number(purchase.totalAmount).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-zinc-500">Fornecedor</p>
          <p className="font-medium">{purchase.supplier.name}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-zinc-500">Unidade</p>
          <p className="font-medium">{purchase.unit.name}</p>
        </div>
        {purchase.invoiceNumber && <div className="rounded-lg border p-4"><p className="text-xs text-zinc-500">Nota Fiscal</p><p className="font-medium">{purchase.invoiceNumber}</p></div>}
        <div className="rounded-lg border p-4"><p className="text-xs text-zinc-500">Data</p><p className="text-sm">{new Date(purchase.createdAt).toLocaleString('pt-BR')}</p></div>
        {purchase.confirmedAt && <div className="rounded-lg border border-green-200 bg-green-50 p-4"><p className="text-xs text-green-600">Confirmada em</p><p className="text-sm text-green-700">{new Date(purchase.confirmedAt).toLocaleString('pt-BR')}</p></div>}
        {purchase.cancelledAt && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-xs text-red-600">Cancelada em</p><p className="text-sm text-red-700">{new Date(purchase.cancelledAt).toLocaleString('pt-BR')}</p></div>}
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-zinc-50 px-4 py-2">
          <h2 className="text-sm font-semibold text-zinc-600">Itens</h2>
        </div>
        <div className="divide-y">
          {purchase.items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-zinc-500">Qtd: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">R$ {Number(item.unitCost).toFixed(2)} un.</p>
                <p className="text-xs text-zinc-500">Total: R$ {Number(item.totalCost).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {purchase.status === 'DRAFT' && (
        <div className="flex gap-3">
          <button className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            disabled={actionLoading} onClick={handleConfirm}>
            {actionLoading ? 'Confirmando...' : 'Confirmar Compra'}
          </button>
          <button className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            onClick={() => setShowCancelForm(true)}>Cancelar</button>
        </div>
      )}

      {showCancelForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Cancelar Compra</h3>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={3} value={cancelReason}
              onChange={e => setCancelReason(e.target.value)} placeholder="Motivo do cancelamento" />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-4 py-2 text-sm" onClick={() => setShowCancelForm(false)}>Voltar</button>
              <button className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                disabled={actionLoading} onClick={handleCancel}>Confirmar Cancelamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

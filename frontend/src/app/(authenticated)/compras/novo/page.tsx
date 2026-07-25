'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPurchase } from '@/lib/purchases';
import { fetchSuppliers } from '@/lib/suppliers';
import { fetchUnits } from '@/lib/units';
import { fetchProducts } from '@/lib/products';
import { ErrorBox } from '@/components/crud/error-box';
import type { Supplier } from '@/lib/suppliers';
import type { Unit } from '@/lib/units';
import type { Product } from '@/lib/products';

interface PurchaseItemForm {
  key: string;
  product: Product | null;
  quantity: string;
  unitCost: string;
}

export default function NovaCompraPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItemForm[]>([{ key: '1', product: null, quantity: '', unitCost: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingItem, setSearchingItem] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers({ limit: 100 }).then(r => setSuppliers(r.data)).catch(() => {});
    fetchUnits().then(r => setUnits(r.data ?? r)).catch(() => {});
  }, []);

  function searchProducts(q: string, itemKey: string) {
    setProductSearch(q);
    setSearchingItem(itemKey);
    if (q.length < 1) { setProductResults([]); return }
    fetchProducts({ search: q, limit: 10, active: 'true' })
      .then(r => setProductResults(r.data)).catch(() => setProductResults([]));
  }

  function addItem() {
    setItems([...items, { key: Date.now().toString(), product: null, quantity: '', unitCost: '' }]);
  }

  function removeItem(key: string) {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.key !== key));
  }

  function setItem(key: string, field: string, value: any) {
    setItems(items.map(i => i.key === key ? { ...i, [field]: value } : i));
  }

  const total = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitCost) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupplier) { setError('Selecione um fornecedor'); return }
    if (!selectedUnit) { setError('Selecione uma unidade'); return }
    const validItems = items.filter(i => i.product && i.quantity && i.unitCost);
    if (validItems.length === 0) { setError('Adicione pelo menos um item'); return }

    setSaving(true); setError('');
    try {
      await createPurchase({
        supplierId: selectedSupplier,
        unitId: selectedUnit,
        invoiceNumber: invoiceNumber || undefined,
        notes: notes || undefined,
        items: validItems.map(i => ({
          productId: i.product!.id,
          quantity: parseFloat(i.quantity),
          unitCost: parseFloat(i.unitCost),
        })),
      });
      router.push('/compras');
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
      <h1 className="text-2xl font-bold">Nova Compra</h1>
      <ErrorBox message={error} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Fornecedor *</label>
            <select className="w-full rounded border px-3 py-1.5 text-sm" value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)} required>
              <option value="">Selecione...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Unidade *</label>
            <select className="w-full rounded border px-3 py-1.5 text-sm" value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)} required>
              <option value="">Selecione...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Nota Fiscal</label>
            <input className="w-full rounded border px-3 py-1.5 text-sm" value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-zinc-600">Itens</h2>
            <button type="button" className="text-sm text-blue-600 hover:underline" onClick={addItem}>+ Adicionar Item</button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.key} className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-zinc-500 mb-1">Produto *</label>
                  {item.product ? (
                    <div className="flex items-center justify-between rounded border px-3 py-1.5 text-sm bg-zinc-50">
                      <span>{item.product.name}</span>
                      <button type="button" className="text-xs text-red-600 hover:underline"
                        onClick={() => setItem(item.key, 'product', null)}>Trocar</button>
                    </div>
                  ) : (
                    <div>
                      <input className="w-full rounded border px-3 py-1.5 text-sm" placeholder="Buscar produto..."
                        value={searchingItem === item.key ? productSearch : ''}
                        onChange={e => searchProducts(e.target.value, item.key)} />
                      {searchingItem === item.key && productResults.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-40 overflow-y-auto rounded border bg-white shadow-sm">
                          {productResults.map(p => (
                            <button key={p.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
                              onClick={() => { setItem(item.key, 'product', p); setProductResults([]); setProductSearch('') }}>
                              {p.name} {p.barcode ? `(${p.barcode})` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <label className="block text-xs text-zinc-500 mb-1">Qtd *</label>
                  <input type="number" step="0.001" min="0.001" className="w-full rounded border px-3 py-1.5 text-sm"
                    value={item.quantity} onChange={e => setItem(item.key, 'quantity', e.target.value)} />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-zinc-500 mb-1">Valor Un. *</label>
                  <input type="number" step="0.01" min="0" className="w-full rounded border px-3 py-1.5 text-sm"
                    value={item.unitCost} onChange={e => setItem(item.key, 'unitCost', e.target.value)} />
                </div>
                <div className="w-24 text-right">
                  <label className="block text-xs text-zinc-500 mb-1">Total</label>
                  <p className="py-1.5 text-sm font-medium">R$ {((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toFixed(2)}</p>
                </div>
                <button type="button" className="text-sm text-red-600 hover:underline pb-1.5"
                  onClick={() => removeItem(item.key)} disabled={items.length <= 1}>Remover</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Observações</label>
          <textarea className="w-full rounded border px-3 py-1.5 text-sm" rows={2} value={notes}
            onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="rounded-lg border bg-zinc-50 p-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total da Compra</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="rounded bg-zinc-900 px-6 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Criar Compra'}
          </button>
          <button type="button" className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
            onClick={() => router.push('/compras')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

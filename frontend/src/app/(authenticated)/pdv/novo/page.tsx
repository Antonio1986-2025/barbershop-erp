'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProducts } from '@/lib/products';
import { fetchServices } from '@/lib/services';
import { fetchUnits } from '@/lib/units';
import { createSale, createPayment, fetchSale } from '@/lib/sales';
import { fetchCurrentCash } from '@/lib/cash';
import { PAYMENT_METHOD_LABELS } from '@/lib/sales';
import { ErrorBox } from '@/components/crud/error-box';
import { QuickCustomerForm } from '@/components/forms/quick-customer-form';
import type { Product } from '@/lib/products';
import type { Service } from '@/lib/services';
import type { Customer } from '@/lib/customers';
import type { Unit } from '@/lib/units';
import type { Sale, Payment } from '@/lib/sales';

interface CartItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  unitPrice: number;
  quantity: number;
  productId?: string;
  serviceId?: string;
}

export default function NovoPDVPage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'search' | 'payment' | 'success'>('search');
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [cashOpen, setCashOpen] = useState<boolean | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Product | Service)[]>([]);
  const [searchType, setSearchType] = useState<'all' | 'product' | 'service'>('all');
  const [searching, setSearching] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const [sale, setSale] = useState<Sale | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchUnits().then(r => {
      const list = r.data ?? r;
      setUnits(list);
      if (list.length === 1) setSelectedUnit(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedUnit) { setCashOpen(null); return }
    fetchCurrentCash(selectedUnit).then(r => setCashOpen(r !== null)).catch(() => setCashOpen(false));
  }, [selectedUnit]);

  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); return }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        let results: (Product | Service)[] = [];
        if (searchType === 'all' || searchType === 'product') {
          const r = await fetchProducts({ search: searchQuery, limit: 10, active: 'true' });
          results.push(...r.data);
        }
        if (searchType === 'all' || searchType === 'service') {
          const r = await fetchServices({ search: searchQuery, limit: 10, active: 'true' });
          results.push(...r.data);
        }
        setSearchResults(results);
      } catch { setSearchResults([]) }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchType]);

  function addToCart(item: Product | Service) {
    const isProduct = 'salePrice' in item;
    const existing = cart.find(c =>
      isProduct ? c.productId === item.id : c.serviceId === item.id
    );
    if (existing) {
      setCart(cart.map(c =>
        c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, {
        id: item.id + '-' + Date.now(),
        type: isProduct ? 'product' : 'service',
        name: item.name,
        unitPrice: isProduct ? (item as Product).salePrice : (item as Service).price,
        quantity: 1,
        productId: isProduct ? item.id : undefined,
        serviceId: isProduct ? undefined : item.id,
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
    searchRef.current?.focus();
  }

  function updateQuantity(cartId: string, delta: number) {
    setCart(cart.map(c =>
      c.id === cartId ? { ...c, quantity: Math.max(0.001, c.quantity + delta) } : c
    ).filter(c => c.quantity > 0));
  }

  function removeFromCart(cartId: string) {
    setCart(cart.filter(c => c.id !== cartId));
  }

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  async function handleFinalize() {
    if (!selectedUnit) { setError('Selecione uma unidade'); return }
    if (cart.length === 0) { setError('Adicione pelo menos um item'); return }
    if (cashOpen === false) { setError('Caixa não está aberto para esta unidade'); return }

    setCreating(true); setError('');
    try {
      const result = await createSale({
        unitId: selectedUnit,
        customerId: selectedCustomer?.id,
        items: cart.map(item => ({
          productId: item.productId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      setSale(result);
      setStep('payment');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handlePayment() {
    if (!sale) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) { setError('Informe o valor recebido'); return }
    if (amount < sale.total) { setError(`Valor mínimo: R$ ${sale.total.toFixed(2)}`); return }

    setPaying(true); setError('');
    try {
      const payment = await createPayment(sale.id, {
        amount,
        paymentMethod,
      });
      setPayments([payment]);
      const updated = await fetchSale(sale.id);
      setSale(updated);
      setStep('success');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  }

  function resetSale() {
    setCart([]);
    setSelectedCustomer(null);
    setSale(null);
    setPayments([]);
    setPaymentMethod('CASH');
    setPaymentAmount('');
    setStep('search');
    setError('');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Nova Venda</h1>
        <select className="rounded border px-3 py-1.5 text-sm max-w-[200px]"
          value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
          <option value="">Selecione a unidade</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {cashOpen === false && selectedUnit && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          Caixa fechado para esta unidade. Abra o caixa antes de vender.
        </div>
      )}

      <ErrorBox message={error} />

      {step === 'search' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex gap-2">
              {(['all', 'product', 'service'] as const).map(t => (
                <button key={t} className={`rounded-full px-3 py-1 text-xs border ${
                  searchType === t ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300'
                }`} onClick={() => setSearchType(t)}>
                  {t === 'all' ? 'Tudo' : t === 'product' ? 'Produtos' : 'Serviços'}
                </button>
              ))}
            </div>
            <input ref={searchRef} autoFocus
              className="flex-1 rounded border px-3 py-2 text-base"
              placeholder="Buscar produto ou serviço..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          {searchQuery.length >= 1 && (
            <div className="rounded-lg border bg-white shadow-sm">
              {searching ? (
                <p className="p-3 text-sm text-zinc-500">Buscando...</p>
              ) : searchResults.length === 0 ? (
                <p className="p-3 text-sm text-zinc-500">Nenhum resultado encontrado.</p>
              ) : (
                <div className="divide-y max-h-60 overflow-y-auto">
                  {searchResults.map(item => {
                    const isProduct = 'salePrice' in item;
                    return (
                      <button key={item.id} className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-50"
                        onClick={() => addToCart(item)}>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-zinc-500">{isProduct ? 'Produto' : 'Serviço'}{isProduct && (item as Product).barcode ? ` • ${(item as Product).barcode}` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">R$ {(isProduct ? (item as Product).salePrice : (item as Service).price).toFixed(2)}</p>
                          <p className="text-xs text-blue-600">Adicionar</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Itens ({cart.length})</h2>
            <button className="text-sm text-blue-600 hover:underline"
              onClick={() => setShowCustomerPicker(true)}>
              {selectedCustomer ? `Cliente: ${selectedCustomer.name}` : 'Selecionar cliente'}
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center text-sm text-zinc-400">
              Busque produtos ou serviços para adicionar à venda
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border bg-white p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500">R$ {item.unitPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="flex h-7 w-7 items-center justify-center rounded border text-sm hover:bg-zinc-100"
                      onClick={() => updateQuantity(item.id, -1)}>−</button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button className="flex h-7 w-7 items-center justify-center rounded border text-sm hover:bg-zinc-100"
                      onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                  <p className="w-20 text-right text-sm font-semibold">R$ {(item.unitPrice * item.quantity).toFixed(2)}</p>
                  <button className="text-xs text-red-600 hover:underline"
                    onClick={() => removeFromCart(item.id)}>Remover</button>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="rounded-lg border bg-zinc-50 p-4">
              <div className="flex justify-between text-base">
                <span>Subtotal</span>
                <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
              </div>
              <button className="mt-4 w-full rounded bg-zinc-900 py-3 text-base font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
                disabled={creating || !selectedUnit} onClick={handleFinalize}>
                {creating ? 'Criando venda...' : `Finalizar Venda — R$ ${subtotal.toFixed(2)}`}
              </button>
            </div>
          )}
        </>
      )}

      {step === 'payment' && sale && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-green-50 p-4 text-center">
            <p className="text-sm text-green-700">Venda criada com sucesso!</p>
            <p className="text-xs text-green-600">ID: {sale.id.slice(0, 8)}...</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-600">Resumo</h3>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span>{item.name} x{item.quantity}</span>
                <span>R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t pt-2 font-bold">
              <span>Total</span>
              <span>R$ {sale.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-600">Pagamento</h3>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Forma de Pagamento</label>
              <select className="w-full rounded border px-3 py-2 text-sm"
                value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) =>
                  <option key={k} value={k}>{v}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Valor Recebido</label>
              <input type="number" step="0.01" min={sale.total}
                className="w-full rounded border px-3 py-2 text-lg font-bold"
                placeholder={sale.total.toFixed(2)} value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)} />
              {parseFloat(paymentAmount) > sale.total && (
                <p className="mt-1 text-sm text-green-600">
                  Troco: R$ {(parseFloat(paymentAmount) - sale.total).toFixed(2)}
                </p>
              )}
            </div>

            <button className="w-full rounded bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              disabled={paying} onClick={handlePayment}>
              {paying ? 'Processando...' : `Confirmar Pagamento — R$ ${sale.total.toFixed(2)}`}
            </button>

            <button className="w-full rounded border py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              onClick={() => { setStep('search'); setSale(null) }}>
              Voltar e editar venda
            </button>
          </div>
        </div>
      )}

      {step === 'success' && sale && (
        <div className="space-y-4 text-center">
          <div className="rounded-lg border border-green-300 bg-green-50 p-8">
            <p className="text-4xl mb-2">✅</p>
            <h2 className="text-xl font-bold text-green-800">Venda Concluída!</h2>
            <p className="text-sm text-green-700 mt-1">R$ {sale.total.toFixed(2)}</p>
            {payments[0] && (
              <p className="text-xs text-green-600">
                {PAYMENT_METHOD_LABELS[payments[0].paymentMethod] ?? payments[0].paymentMethod}
              </p>
            )}
            {selectedCustomer && (
              <p className="text-xs text-green-600 mt-1">Cliente: {selectedCustomer.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button className="rounded bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700"
              onClick={() => router.push(`/pdv/${sale.id}`)}>
              Ver Detalhes da Venda
            </button>
            <button className="rounded border px-6 py-3 text-sm text-zinc-600 hover:bg-zinc-50"
              onClick={resetSale}>
              Nova Venda
            </button>
            <button className="text-sm text-zinc-500 hover:underline"
              onClick={() => router.push('/pdv')}>
              Ir para Lista de Vendas
            </button>
          </div>
        </div>
      )}

      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-xl sm:rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Cliente</h3>
            <QuickCustomerForm onSave={(customer) => {
              setSelectedCustomer(customer);
              setShowCustomerPicker(false);
            }} />
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded border px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
                onClick={() => { setSelectedCustomer(null); setShowCustomerPicker(false) }}>
                Venda avulsa (sem cliente)
              </button>
              <button className="rounded border px-3 py-2 text-sm text-zinc-500"
                onClick={() => setShowCustomerPicker(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

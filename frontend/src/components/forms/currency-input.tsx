'use client';

import { useState, useCallback, type InputHTMLAttributes } from 'react';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | string;
  onChange: (valueInCents: number) => void;
  label?: string;
}

/**
 * CurrencyInput — Máscara de moeda brasileira (R$)
 * 
 * O usuário digita só números, da direita pra esquerda.
 * Ex: digita 15055 → mostra R$ 150,55
 * 
 * Uso:
 *   <CurrencyInput value={preco} onChange={(v) => setPreco(v)} />
 *   <CurrencyInput value={15050} onChange={setPreco} label="Preço" />
 */
export function CurrencyInput({ value, onChange, label, className = '', ...props }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  // Converte valor numérico (centavos) pra string exibível
  const formatBRL = useCallback((val: number): string => {
    return (val / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // Valor em centavos
  const cents = typeof value === 'string' ? Math.round(parseFloat(value) * 100) : Math.round(value);

  // Texto exibido no input
  const displayValue = focused
    ? String(cents || '0')
    : cents === 0 && !focused
      ? ''
      : formatBRL(cents);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    const newCents = parseInt(raw || '0', 10);
    onChange(newCents);
  }

  function handleBlur() {
    setFocused(false);
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setFocused(true);
    // Seleciona todo o texto
    e.target.select();
  }

  return (
    <div className="relative">
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full rounded-md border border-border bg-background pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}

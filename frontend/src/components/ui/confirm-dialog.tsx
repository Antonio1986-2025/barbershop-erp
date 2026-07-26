'use client';

import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const colors = {
    danger: {
      icon: 'text-red-500',
      bg: 'bg-red-50 border-red-200',
      btn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'text-yellow-500',
      bg: 'bg-yellow-50 border-yellow-200',
      btn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      icon: 'text-blue-500',
      bg: 'bg-blue-50 border-blue-200',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const c = colors[variant];

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      {/* Dialog */}
      <div className={`relative z-10 w-full max-w-md rounded-xl border p-6 shadow-xl ${c.bg} bg-white`}>
        <div className="flex items-start gap-4">
          <span className={`text-2xl ${c.icon}`}>
            {variant === 'danger' ? '⚠️' : variant === 'warning' ? '⚡' : 'ℹ️'}
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="w-full rounded-md border border-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors sm:w-auto"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 sm:w-auto ${c.btn}`}
          >
            {saving ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hook para usar ConfirmDialog */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm?: () => void | Promise<void>;
  }>({ open: false, title: '', message: '' });

  const confirm = (
    title: string,
    message: string,
    variant?: 'danger' | 'warning' | 'info',
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        variant,
        onConfirm: () => {
          resolve(true);
          setState((s) => ({ ...s, open: false }));
        },
      });
    });
  };

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      variant={state.variant}
      onConfirm={state.onConfirm || (() => {})}
      onCancel={() => {
        setState((s) => ({ ...s, open: false }));
      }}
    />
  );

  return { confirm, dialog };
}

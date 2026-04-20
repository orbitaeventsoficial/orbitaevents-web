'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ADMIN_SHARED_HELP, helpAttrs } from './adminHelpContent';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const VARIANT_STYLES: Record<ConfirmVariant, { button: string; icon: string }> = {
  danger: {
    button: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500/50',
    icon: '⚠️',
  },
  warning: {
    button: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50',
    icon: '⚡',
  },
  info: {
    button: 'bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500/50',
    icon: 'ℹ️',
  },
};

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: ConfirmVariant;
    confirmLabel: string;
    resolve: ((confirmed: boolean) => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmLabel: 'Confirmar',
    resolve: null,
  });

  const confirm = useCallback(
    (opts: {
      title: string;
      message: string;
      variant?: ConfirmVariant;
      confirmLabel?: string;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          title: opts.title,
          message: opts.message,
          variant: opts.variant || 'danger',
          confirmLabel: opts.confirmLabel || 'Confirmar',
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  const dialogProps: ConfirmDialogProps = {
    open: state.open,
    title: state.title,
    message: state.message,
    variant: state.variant,
    confirmLabel: state.confirmLabel,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return { confirm, dialogProps };
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      {...helpAttrs(ADMIN_SHARED_HELP.confirmDialog)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onCancel} />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-black p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl">{styles.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-white">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-white/60 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
            {...helpAttrs(ADMIN_SHARED_HELP.confirmCancel)}
          >
            Cancel·lar
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${styles.button}`}
            {...helpAttrs(ADMIN_SHARED_HELP.confirmAccept)}
          >
            {busy ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processant...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

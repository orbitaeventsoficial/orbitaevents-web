'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

// Botons de confirmació via token de la sèrie. danger/warning mantenen la convenció
// UX destructiva (vermell/ambre) però des de --o-*; info = or de sèrie (mai blau).
const VARIANT_STYLES: Record<ConfirmVariant, { button: string; icon: string }> = {
  danger: {
    button: 'bg-[var(--o-danger)] text-[var(--t)] hover:brightness-110 focus:ring-[var(--o-danger)]/50',
    icon: '⚠️',
  },
  warning: {
    button: 'bg-[var(--o-warning)] text-[var(--o-admin-ink)] hover:brightness-110 focus:ring-[var(--o-warning)]/50',
    icon: '⚡',
  },
  info: {
    button: 'bg-[var(--gold)] text-[var(--o-admin-ink)] hover:brightness-110 focus:ring-[var(--gold)]/50',
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
  const [mounted, setMounted] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const styles = VARIANT_STYLES[variant];

  useEffect(() => { setMounted(true); }, []);

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

  const dur = shouldReduceMotion ? 0 : 0.15;
  const scaleTo = shouldReduceMotion ? 1 : 0.95;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          {...helpAttrs(ADMIN_SHARED_HELP.confirmDialog)}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur }}
          />

          <motion.div
            className="relative w-full max-w-sm ap-card p-6 shadow-2xl"
            initial={{ opacity: 0, scale: scaleTo }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: scaleTo }}
            transition={{ duration: dur, ease: 'easeOut' }}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">{styles.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 id="confirm-dialog-title" className="text-base font-semibold text-[var(--t)]">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm text-[var(--t2)] leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="ap-btn disabled:opacity-50"
                {...helpAttrs(ADMIN_SHARED_HELP.confirmCancel)}
              >
                Cancel·lar
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={handleConfirm}
                disabled={busy}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-[var(--t)] transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${styles.button}`}
                {...helpAttrs(ADMIN_SHARED_HELP.confirmAccept)}
              >
                {busy ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--line)] border-t-white" />
                    Processant...
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

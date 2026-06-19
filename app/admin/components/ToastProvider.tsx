'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// ── Toast inline (before: imported from AdminUI.tsx) ──

type ToastType = 'success' | 'error' | 'warning' | 'info';

const TOAST_STYLES: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'admin-tone-bg-success admin-tone-border-success', icon: '✅' },
  error: { bg: 'admin-tone-bg-danger admin-tone-border-danger', icon: '❌' },
  warning: { bg: 'admin-tone-bg-warning admin-tone-border-warning', icon: '⚠️' },
  info: { bg: 'admin-tone-bg-info admin-tone-border-info', icon: 'ℹ️' },
};

function Toast({ type, message, onClose }: { type: ToastType; message: string; onClose?: () => void }) {
  const style = TOAST_STYLES[type];
  return (
    <div className={`flex items-center gap-3 rounded-xl border ${style.bg} px-4 py-3 shadow-2xl admin-card-glass`}>
      <span className="text-lg">{style.icon}</span>
      <p className="text-sm">{message}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="ml-2" aria-label="Tancar notificació">✕</button>
      )}
    </div>
  );
}

type ToastItem = {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api: ToastApi = {
    success: useCallback((msg: string) => addToast('success', msg), [addToast]),
    error: useCallback((msg: string) => addToast('error', msg), [addToast]),
    warning: useCallback((msg: string) => addToast('warning', msg), [addToast]),
    info: useCallback((msg: string) => addToast('info', msg), [addToast]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast stack — bottom-right, stacked */}
      <div role="status" aria-live="polite" className="fixed bottom-20 sm:bottom-4 right-4 z-[101] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className="pointer-events-auto"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            >
              <Toast type={t.type} message={t.message} onClose={() => remove(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback silenciós quan no hi ha provider (SSR, etc.)
    const noop = () => {};
    return { success: noop, error: noop, warning: noop, info: noop };
  }
  return ctx;
}

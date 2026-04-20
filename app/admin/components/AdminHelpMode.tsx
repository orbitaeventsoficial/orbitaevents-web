'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AdminHelpModeContextValue = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (value: boolean) => void;
};

const STORAGE_KEY = 'orbita.admin.help-mode';

const AdminHelpModeContext = createContext<AdminHelpModeContextValue | null>(null);

export function AdminHelpModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setEnabled(false);
    window.localStorage.setItem(STORAGE_KEY, '0');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  }, [enabled, hydrated]);

  const value = useMemo(
    () => ({
      enabled,
      toggle: () => setEnabled((prev) => !prev),
      setEnabled,
    }),
    [enabled]
  );

  return (
    <AdminHelpModeContext.Provider value={value}>
      {children}
    </AdminHelpModeContext.Provider>
  );
}

export function useAdminHelpMode() {
  const ctx = useContext(AdminHelpModeContext);
  if (!ctx) {
    throw new Error('useAdminHelpMode s’ha d’usar dins de AdminHelpModeProvider');
  }
  return ctx;
}

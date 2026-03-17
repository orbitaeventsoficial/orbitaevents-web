'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type AdminHelpModeContextValue = {
  enabled: boolean;
  toggle: () => void;
};

const AdminHelpModeContext = createContext<AdminHelpModeContextValue | null>(null);

export function AdminHelpModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  const value = useMemo(
    () => ({
      enabled,
      toggle: () => setEnabled((prev) => !prev),
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

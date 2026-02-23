'use client';

import { useState, useCallback, useEffect } from 'react';

interface AdminAlerts {
  newLeadsCount: number;
  packPriceAlertsCount: number;
  financeAlertsCount: number;
  totalCount: number;
}

export function useAdminAlerts(): AdminAlerts {
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [packPriceAlertsCount, setPackPriceAlertsCount] = useState(0);
  const [financeAlertsCount, setFinanceAlertsCount] = useState(0);

  const fetchNewLeadsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads?countOnly=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNewLeadsCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const fetchPackPriceAlertsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/packs/price-alerts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPackPriceAlertsCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const fetchFinanceAlertsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance/alerts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFinanceAlertsCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchNewLeadsCount();
    fetchPackPriceAlertsCount();
    fetchFinanceAlertsCount();
  }, [fetchNewLeadsCount, fetchPackPriceAlertsCount, fetchFinanceAlertsCount]);

  // Càrrega inicial en idle per no bloquejar render
  useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number })
        .requestIdleCallback(() => fetchAll());
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }
    const timeoutId = globalThis.setTimeout(fetchAll, 250);
    return () => globalThis.clearTimeout(timeoutId);
  }, [fetchAll]);

  // Refresc quan la pestanya torna visible
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchAll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [fetchAll]);

  return {
    newLeadsCount,
    packPriceAlertsCount,
    financeAlertsCount,
    totalCount: newLeadsCount + packPriceAlertsCount + financeAlertsCount,
  };
}

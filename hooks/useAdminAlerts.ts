'use client';

import { useState, useCallback, useEffect } from 'react';

interface AdminAlerts {
  newLeadsCount: number;
  inboxUnreadCount: number;
  packPriceAlertsCount: number;
  financeAlertsCount: number;
  totalCount: number;
}

export function useAdminAlerts(): AdminAlerts {
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
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

  const fetchInboxUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox/messages?action=count', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setInboxUnreadCount(data.unread || 0);
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
    fetchInboxUnreadCount();
    fetchPackPriceAlertsCount();
    fetchFinanceAlertsCount();
  }, [fetchNewLeadsCount, fetchInboxUnreadCount, fetchPackPriceAlertsCount, fetchFinanceAlertsCount]);

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

  // Polling lleuger per reflectir entrades i correus nous sense recarregar
  useEffect(() => {
    const intervalId = window.setInterval(fetchAll, 60000);
    return () => window.clearInterval(intervalId);
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
    inboxUnreadCount,
    packPriceAlertsCount,
    financeAlertsCount,
    totalCount: newLeadsCount + inboxUnreadCount + packPriceAlertsCount + financeAlertsCount,
  };
}

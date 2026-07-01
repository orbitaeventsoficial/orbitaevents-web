'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { BOOKING_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from '@/lib/constants';
import { ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS } from '@/lib/constants/admin';
import { buildCustomerBookingListHref } from '@/lib/admin/customerWorkspaceHref';

function buildBookingsHref(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/admin/bookings?${query}` : '/admin/bookings';
}

function ViewToggleInline() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get('customerId') || '';
  const current = searchParams?.get('view') || 'list';

  const toggle = (view: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (view === 'list') params.delete('view'); else params.set('view', view);
    params.delete('page');
    const query = params.toString();
    router.push(customerId
      ? `${buildCustomerBookingListHref(customerId)}${query ? `?${query}` : ''}`
      : query ? `/admin/bookings?${query}` : '/admin/bookings'
    );
  };

  return (
    <div role="tablist" aria-label="Vista de reserves" className="flex shrink-0 overflow-hidden rounded-xl border admin-tone-border-neutral admin-tone-bg-neutral">
      {(['list', 'kanban'] as const).map((v) => (
        <button key={v} type="button" role="tab" aria-selected={current === v} onClick={() => toggle(v)}
          className={`px-3 py-2 text-xs font-medium transition-colors ${current === v ? 'admin-tone-bg-info admin-tone-text-info font-semibold' : 'admin-tone-text-neutral hover:brightness-105'}`}>
          {v === 'list' ? 'Llista' : 'Kanban'}
        </button>
      ))}
    </div>
  );
}

export default function BookingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get('customerId') || '';
  const currentSearch = searchParams?.get('search') || '';

  const [search, setSearch] = useState(currentSearch);
  const status = searchParams?.get('status') || '';
  const eventType = searchParams?.get('eventType') || '';
  const payment = searchParams?.get('payment') || '';
  const fromDate = searchParams?.get('fromDate') || '';
  const toDate = searchParams?.get('toDate') || '';

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('page');
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const query = params.toString();
      router.push(
        customerId
          ? buildCustomerBookingListHref(customerId, {
              view: params.get('view'),
              status: params.get('status'),
              eventType: params.get('eventType'),
              payment: params.get('payment'),
              fromDate: params.get('fromDate'),
              toDate: params.get('toDate'),
              search: params.get('search'),
              page: params.get('page') ? Number(params.get('page')) : null,
            })
          : buildBookingsHref(params)
      );
    },
    [customerId, router, searchParams],
  );

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== currentSearch) {
        updateParams({ search });
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [currentSearch, search, updateParams]);

  const hasFilters = status || eventType || payment || fromDate || toDate || search;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Cerca */}
      <div className="relative w-[min(100%,16.25rem)]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Cercar..."
          aria-label="Cercar reserves"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:ring-1 transition-all"
        />
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          aria-label="Filtrar per estat"
          className="rounded-xl border px-3 py-1.5 text-xs font-medium bg-transparent"
        >
          <option value="">Tots els estats</option>
          {BOOKING_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={eventType}
          onChange={(e) => updateParams({ eventType: e.target.value })}
          aria-label="Filtrar per tipus d'esdeveniment"
          className="rounded-xl border px-3 py-1.5 text-xs font-medium bg-transparent"
        >
          <option value="">Tots els tipus</option>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={payment}
          onChange={(e) => updateParams({ payment: e.target.value })}
          aria-label="Filtrar per cobrament"
          className="rounded-xl border px-3 py-1.5 text-xs font-medium bg-transparent"
        >
          {ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id === 'all' ? '' : opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => updateParams({ fromDate: e.target.value })}
          aria-label="Data des de"
          className="rounded-xl border px-3 py-1.5 text-xs bg-transparent"
          title="Des de"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => updateParams({ toDate: e.target.value })}
          aria-label="Data fins a"
          className="rounded-xl border px-3 py-1.5 text-xs bg-transparent"
          title="Fins a"
          min={fromDate || undefined}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              router.push(customerId ? buildCustomerBookingListHref(customerId) : '/admin/bookings');
            }}
            className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Toggle vista — al final de la fila */}
      <ViewToggleInline />
    </div>
  );
}

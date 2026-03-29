'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { BOOKING_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from '@/lib/constants';
import { ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS } from '@/lib/constants/admin';

export default function BookingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams?.get('search') || '');
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
      router.push(`/admin/bookings?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = searchParams?.get('search') || '';
      if (search !== current) {
        updateParams({ search });
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, searchParams, updateParams]);

  const hasFilters = status || eventType || payment || fromDate || toDate || search;

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder="Cercar per nom, referència, ubicació..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:ring-1 transition-all"
        />
      </div>

      <div className="flex flex-wrap gap-2">
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
              router.push('/admin/bookings');
            }}
            className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Netejar filtres
          </button>
        )}
      </div>
    </div>
  );
}

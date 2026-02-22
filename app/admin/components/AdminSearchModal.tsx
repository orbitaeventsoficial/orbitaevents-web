'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { labelEstatReserva } from '@/lib/customer-hub/labels';

type LeadResult = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

type BookingResult = {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  status: string;
  eventDate: string;
};

type CustomerResult = {
  id: string;
  name: string;
  email: string;
  totalEvents: number;
  lastEventDate: string | null;
};

type SearchResults = {
  leads: LeadResult[];
  bookings: BookingResult[];
  customers: CustomerResult[];
};

const EMPTY_RESULTS: SearchResults = { leads: [], bookings: [], customers: [] };

export default function AdminSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const search = deferredQuery.trim();
    if (search.length < 2) {
      setResults(EMPTY_RESULTS);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/admin/search?q=${encodeURIComponent(search)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Error buscant');
        }
        setResults({
          leads: data.leads || [],
          bookings: data.bookings || [],
          customers: data.customers || [],
        });
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError('Error carregant resultats');
        setResults(EMPTY_RESULTS);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [deferredQuery, open]);

  const hasResults = useMemo(() => {
    return results.leads.length > 0 || results.bookings.length > 0 || results.customers.length > 0;
  }, [results]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 sm:p-6" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-search-title"
        className="mx-auto max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca entrades, reserves o clients..."
            aria-label="Cercar al panell d’administració"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs"
          >
            Esc
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 text-xs" id="admin-search-title">
            Escriu almenys 2 caràcters
          </div>

          {loading && (
            <div className="px-4 pb-4 text-xs">Carregant resultats...</div>
          )}

          {error && (
            <div className="px-4 pb-4 text-xs">{error}</div>
          )}

          {!loading && !error && query.trim().length >= 2 && !hasResults && (
            <div className="px-4 pb-4 text-xs">Sense resultats.</div>
          )}

          {results.leads.length > 0 && (
            <div className="border-t px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider">Entrades</p>
              <div className="mt-2 space-y-2">
                {results.leads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/admin/leads/${lead.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{lead.name}</span>
                    <span className="text-[11px]">{lead.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.bookings.length > 0 && (
            <div className="border-t px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider">Reserves</p>
              <div className="mt-2 space-y-2">
                {results.bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{booking.reference} · {booking.clientName}</span>
                    <span className="text-[11px]">{labelEstatReserva(booking.status)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.customers.length > 0 && (
            <div className="border-t px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider">Clients</p>
              <div className="mt-2 space-y-2">
                {results.customers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/admin/contactes/${customer.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{customer.name}</span>
                    <span className="text-[11px]">{customer.totalEvents} esdeveniments</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!hasResults && query.trim().length < 2 && (
            <div className="border-t px-4 py-4">
              <p className="text-[11px] uppercase tracking-wider">Accessos ràpids</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { href: '/admin/leads', label: '👥 Entrades' },
                  { href: '/admin/bookings', label: '📋 Reserves' },
                  { href: '/admin/sales-ops', label: '🎯 Sales Ops' },
                  { href: '/admin/economia', label: '💶 Economia' },
                  { href: '/admin/analytics', label: '📈 Analítica' },
                  { href: '/admin/clientes', label: '👤 Clients' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { labelEstatReserva } from '@/lib/customer-hub/labels';
import {
  buildAdminCommandEntries,
  buildAdminCommandItems,
  buildAdminRecentEntries,
  buildAdminSearchEntries,
  buildAdminSelectableEntries,
  filterAdminCommandItems,
  type AdminPaletteBookingResult,
  type AdminPaletteCustomerResult,
  type AdminPaletteEntry,
  type AdminPaletteLeadResult,
  type AdminPaletteRecentItem,
  type AdminPaletteSearchResults,
} from '@/lib/services/adminCommandPaletteService';
import { ADMIN_SHARED_HELP, helpAttrs } from './adminHelpContent';
import { getPriorityItems, NAV_SECTIONS } from './nav-items';

const EMPTY_RESULTS: AdminPaletteSearchResults = { leads: [], bookings: [], customers: [] };
const RECENT_KEY = 'admin.recent';
const MAX_RECENT = 8;
const MIN_QUERY_LENGTH = 2;

function getRecentItems(): AdminPaletteRecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as AdminPaletteRecentItem[]) : [];
  } catch {
    return [];
  }
}

function addRecentItem(item: AdminPaletteRecentItem) {
  if (typeof window === 'undefined') return;
  try {
    const items = getRecentItems().filter((current) => current.href !== item.href);
    items.unshift(item);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  } catch {
    // silent
  }
}

function PaletteRow({
  item,
  selected,
  onSelect,
}: {
  item: AdminPaletteEntry;
  selected: boolean;
  onSelect: (item: AdminPaletteEntry) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
        selected ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-base">{item.icon}</span>
        <div className="min-w-0">
          <p className="truncate">{item.label}</p>
          <p className="truncate text-[11px] opacity-60">{item.meta}</p>
        </div>
      </div>
      <span className="shrink-0 text-[10px] uppercase tracking-wider opacity-55">{item.type}</span>
    </button>
  );
}

function RecentItems({
  items,
  selectedIndex,
  startIndex,
  onSelect,
}: {
  items: AdminPaletteRecentItem[];
  selectedIndex: number;
  startIndex: number;
  onSelect: (item: AdminPaletteEntry) => void;
}) {
  if (items.length === 0) return null;

  const entries = buildAdminRecentEntries(items);

  return (
    <div className="border-t border-white/10 px-4 py-3" {...helpAttrs(ADMIN_SHARED_HELP.recentItems)}>
      <p className="text-[11px] uppercase tracking-wider opacity-60">Visitats recentment</p>
      <div className="mt-2 space-y-1">
        {entries.map((item, index) => (
          <PaletteRow
            key={item.key}
            item={item}
            selected={selectedIndex === startIndex + index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminPaletteSearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<AdminPaletteRecentItem[]>([]);
  const deferredQuery = useDeferredValue(query);

  const commandItems = useMemo(() => buildAdminCommandItems(getPriorityItems(0), NAV_SECTIONS), []);
  const trimmedQuery = deferredQuery.trim().toLowerCase();
  const isSearchingEntities = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const filteredCommandItems = useMemo(
    () => filterAdminCommandItems(commandItems, trimmedQuery, 8),
    [commandItems, trimmedQuery],
  );

  const commandEntries = useMemo(() => buildAdminCommandEntries(filteredCommandItems), [filteredCommandItems]);
  const searchEntries = useMemo(() => buildAdminSearchEntries(results), [results]);
  const recentEntries = useMemo(() => buildAdminRecentEntries(recentItems), [recentItems]);
  const selectableEntries = useMemo(
    () => buildAdminSelectableEntries({ isSearchingEntities, commandEntries, searchEntries, recentEntries }),
    [isSearchingEntities, commandEntries, searchEntries, recentEntries],
  );

  useEffect(() => {
    if (!open) return;
    setRecentItems(getRecentItems());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const search = deferredQuery.trim();
    if (search.length < MIN_QUERY_LENGTH) {
      setResults(EMPTY_RESULTS);
      setError(null);
      setLoading(false);
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
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Error buscant');
        }
        setResults({
          leads: (data.leads || []).map((lead: AdminPaletteLeadResult) => ({
            id: lead.id,
            name: lead.name,
            status: lead.status,
          })),
          bookings: (data.bookings || []).map((booking: AdminPaletteBookingResult & { status: string }) => ({
            id: booking.id,
            reference: booking.reference,
            clientName: booking.clientName,
            statusLabel: labelEstatReserva(booking.status),
          })),
          customers: (data.customers || []).map((customer: AdminPaletteCustomerResult) => ({
            id: customer.id,
            name: customer.name,
            totalEvents: customer.totalEvents,
          })),
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

  useEffect(() => {
    setSelectedIndex(0);
  }, [trimmedQuery, results, recentItems, open]);

  const closeAndReset = () => {
    setQuery('');
    setResults(EMPTY_RESULTS);
    setError(null);
    setSelectedIndex(0);
    onClose();
  };

  const handleSelect = (item: AdminPaletteEntry) => {
    addRecentItem({ href: item.href, label: item.label, type: item.type });
    setRecentItems(getRecentItems());
    closeAndReset();
    router.push(item.href);
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndReset();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (selectableEntries.length === 0) return;
        setSelectedIndex((current) => (current + 1) % selectableEntries.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (selectableEntries.length === 0) return;
        setSelectedIndex((current) => (current - 1 + selectableEntries.length) % selectableEntries.length);
        return;
      }
      if (event.key === 'Enter' && document.activeElement === inputRef.current && selectableEntries.length > 0) {
        event.preventDefault();
        handleSelect(selectableEntries[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectableEntries, selectedIndex]);

  const hasResults = commandEntries.length > 0 || searchEntries.length > 0;
  const leadEntries = searchEntries.filter((entry) => entry.type === 'Entrada');
  const bookingEntries = searchEntries.filter((entry) => entry.type === 'Reserva');
  const customerEntries = searchEntries.filter((entry) => entry.type === 'Client');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm sm:p-6" role="presentation" onClick={closeAndReset}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-search-title"
        onClick={(event) => event.stopPropagation()}
        className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1117]/95 shadow-2xl"
        {...helpAttrs(ADMIN_SHARED_HELP.searchModal)}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="text-base">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca o executa una acció..."
            aria-label="Cercar o executar al panell d’administració"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
            {...helpAttrs(ADMIN_SHARED_HELP.searchInput)}
          />
          <div className="hidden rounded-lg border border-white/10 px-2 py-1 text-[11px] opacity-60 sm:block">↑↓ moure · Enter obrir</div>
          <button type="button" onClick={closeAndReset} className="rounded-xl px-2 py-1 text-xs opacity-70 transition hover:opacity-100">Esc</button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 text-xs opacity-60" id="admin-search-title">
            {isSearchingEntities ? 'Comandes i resultats reals del CRM' : 'Obre una secció, reprèn feina recent o llança una acció'}
          </div>

          {loading && <div className="px-4 pb-4 text-xs opacity-70">Carregant resultats...</div>}
          {error && <div className="px-4 pb-4 text-xs text-rose-300">{error}</div>}

          {!isSearchingEntities && (
            <RecentItems items={recentItems} selectedIndex={selectedIndex} startIndex={0} onSelect={handleSelect} />
          )}

          {commandEntries.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider opacity-60">Comandes</p>
              <div className="mt-2 space-y-1">
                {commandEntries.map((item, index) => {
                  const offset = isSearchingEntities ? 0 : recentEntries.length;
                  return <PaletteRow key={item.key} item={item} selected={selectedIndex === offset + index} onSelect={handleSelect} />;
                })}
              </div>
            </div>
          )}

          {isSearchingEntities && leadEntries.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider opacity-60">Entrades</p>
              <div className="mt-2 space-y-1">
                {leadEntries.map((item, index) => (
                  <PaletteRow key={item.key} item={item} selected={selectedIndex === commandEntries.length + index} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          )}

          {isSearchingEntities && bookingEntries.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider opacity-60">Reserves</p>
              <div className="mt-2 space-y-1">
                {bookingEntries.map((item, index) => {
                  const start = commandEntries.length + leadEntries.length;
                  return <PaletteRow key={item.key} item={item} selected={selectedIndex === start + index} onSelect={handleSelect} />;
                })}
              </div>
            </div>
          )}

          {isSearchingEntities && customerEntries.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider opacity-60">Clients</p>
              <div className="mt-2 space-y-1">
                {customerEntries.map((item, index) => {
                  const start = commandEntries.length + leadEntries.length + bookingEntries.length;
                  return <PaletteRow key={item.key} item={item} selected={selectedIndex === start + index} onSelect={handleSelect} />;
                })}
              </div>
            </div>
          )}

          {!loading && !error && isSearchingEntities && !hasResults && (
            <div className="border-t border-white/10 px-4 py-4 text-xs opacity-70">Sense coincidències. Prova amb nom de client, reserva, mòdul o acció.</div>
          )}

          {!isSearchingEntities && (
            <div className="border-t border-white/10 px-4 py-4">
              <p className="mb-2 text-[11px] uppercase tracking-wider opacity-60">Dreceres de teclat</p>
              <div className="grid gap-1.5 text-xs sm:grid-cols-2">
                {[
                  { keys: 'Ctrl/Cmd+K', desc: 'Obrir command palette' },
                  { keys: 'Alt+1', desc: 'Entrades' },
                  { keys: 'Alt+2', desc: 'Clients' },
                  { keys: 'Alt+3', desc: 'Tasques' },
                  { keys: 'Alt+4', desc: 'Reserves' },
                  { keys: 'Alt+C', desc: 'Calendari' },
                  { keys: 'Alt+N', desc: 'Accions ràpides (+)' },
                ].map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center gap-2">
                    <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">{shortcut.keys}</kbd>
                    <span>{shortcut.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

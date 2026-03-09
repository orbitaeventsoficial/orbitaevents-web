'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EVENT_TYPE_PLAIN, formatDateShort, formatDateFull, DEFAULT_LOCALE } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

type CalendarApiDay = {
  reservas: {
    id: string;
    leadId?: string | null;
    customerId?: string | null;
    fechaEvento: string;
    clienteNombre?: string | null;
    ubicacion?: string | null;
    estado?: string | null;
    eventType?: string | null;
    eventStartTime?: string | null;
    eventEndTime?: string | null;
    packName?: string | null;
  }[];
  bloqueos: {
    id: string;
    fecha: string;
    motivo?: string | null;
    notas?: string | null;
  }[];
};

type CalendarApiResponse = {
  days: Record<string, CalendarApiDay>; // key: 'YYYY-MM-DD'
};

type MonthYear = {
  year: number;
  month: number; // 0-11
};

type CalendarCell = {
  date: Date;
  key: string; // YYYY-MM-DD
  inCurrentMonth: boolean;
};

const weekdayLabels = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']; // dilluns primer

const CALENDAR_EVENT_LABELS: Record<string, string> = {
  ...EVENT_TYPE_PLAIN,
  CELEBRATION: 'Celebració',
};

function resolveServiceLabel(booking: CalendarApiDay['reservas'][number]): string {
  const pack = booking.packName?.trim();
  if (pack) return pack;
  const eventType = booking.eventType?.trim();
  if (eventType && CALENDAR_EVENT_LABELS[eventType]) return CALENDAR_EVENT_LABELS[eventType];
  if (eventType) return eventType;
  return 'Servei';
}

function resolveTimeLabel(booking: CalendarApiDay['reservas'][number]): string {
  const start = booking.eventStartTime?.trim();
  const end = booking.eventEndTime?.trim();
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return new Date(booking.fechaEvento).toLocaleTimeString(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthDays({ year, month }: MonthYear): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Dg, 1 = Dl...
  const offsetFromMonday = (firstWeekday + 6) % 7; // passar a setmana que comença dilluns
  const startDate = new Date(year, month, 1 - offsetFromMonday);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push({
      date: d,
      key: formatKey(d),
      inCurrentMonth: d.getMonth() === month,
    });
  }

  return cells;
}

function addMonths(base: MonthYear, delta: number): MonthYear {
  const m = base.month + delta;
  const year = base.year + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  return { year, month };
}

function monthLabel({ year, month }: MonthYear): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function CalendarMonthClient() {
  const toast = useToast();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [monthYear, setMonthYear] = useState<MonthYear>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [draggingBookingId, setDraggingBookingId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [changingDateForBooking, setChangingDateForBooking] = useState<string | null>(null);
  const [blockingDate, setBlockingDate] = useState(false);
  const [blockNote, setBlockNote] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);

  const blockDay = useCallback(async (dateKey: string, note?: string) => {
    setBlockingDate(true);
    try {
      const res = await fetchWithCsrf('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: `${dateKey}T12:00:00.000Z`, note: note || null }),
      });
      if (!res.ok) throw new Error('Error bloquejant dia');
      toast.success(`Dia ${formatDateShort(dateKey)} bloquejat`);
      setRefreshKey((k) => k + 1);
      setShowBlockForm(false);
      setBlockNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error bloquejant dia');
    } finally {
      setBlockingDate(false);
    }
  }, [toast]);

  const unblockDay = useCallback(async (dateKey: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/availability?date=${dateKey}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error desbloquejant dia');
      toast.success(`Dia ${formatDateShort(dateKey)} desbloquejat`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desbloquejant dia');
    }
  }, [toast]);

  const moveBookingToDate = useCallback(async (bookingId: string, newDateKey: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventDate: `${newDateKey}T12:00:00.000Z` }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Error movent reserva');
      }
      toast.success(`Reserva moguda al ${formatDateShort(newDateKey)}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error movent reserva');
    }
  }, [toast]);

  const cells = useMemo(
    () => getMonthDays(monthYear),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- monthYear object reference changes, but year/month are the actual deps
    [monthYear.year, monthYear.month],
  );

  const { fromStr, toStr, visibleRangeLabel } = useMemo(() => {
    const firstVisible = cells[0]?.date;
    const lastVisible = cells[cells.length - 1]?.date;

    if (!firstVisible || !lastVisible) {
      return { fromStr: '', toStr: '', visibleRangeLabel: '' };
    }

    const from = new Date(
      firstVisible.getFullYear(),
      firstVisible.getMonth(),
      firstVisible.getDate(),
    );
    const to = new Date(
      lastVisible.getFullYear(),
      lastVisible.getMonth(),
      lastVisible.getDate() + 1,
    );

    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    const visibleRangeLabel = `${formatDateShort(firstVisible)} – ${formatDateShort(lastVisible)}`;

    return {
      fromStr: toIso(from),
      toStr: toIso(to),
      visibleRangeLabel,
    };
  }, [cells]);

  useEffect(() => {
    if (!fromStr || !toStr) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/calendario/mes?from=${fromStr}&to=${toStr}`,
        );
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        const json = (await res.json()) as CalendarApiResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (e) {
        if (!cancelled) {
          const errorMessage = e instanceof Error ? e.message : 'Error carregant el calendari';
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [fromStr, toStr, refreshKey]);

  const selectedDayData: {
    date?: Date;
    key?: string;
    payload?: CalendarApiDay;
  } = useMemo(() => {
    if (!selectedDateKey) return {};
    const cell = cells.find((c) => c.key === selectedDateKey);
    return {
      date: cell?.date,
      key: selectedDateKey,
      payload: data?.days?.[selectedDateKey],
    };
  }, [selectedDateKey, cells, data]);

  // Stats del mes visible
  const stats = useMemo(() => {
    if (!cells.length) {
      return {
        totalReservas: 0,
        totalBloqueos: 0,
        freeDays: 0,
        reservaDays: 0,
        bloqueadoDays: 0,
        mixedDays: 0,
      };
    }

    let totalReservas = 0;
    let totalBloqueos = 0;
    let freeDays = 0;
    let reservaDays = 0;
    let bloqueadoDays = 0;
    let mixedDays = 0;

    for (const cell of cells) {
      const dayData =
        data?.days?.[cell.key] ??
        ({
          reservas: [],
          bloqueos: [],
        } as CalendarApiDay);

      const hasReservas = dayData.reservas.length > 0;
      const hasBloqueos = dayData.bloqueos.length > 0;

      totalReservas += dayData.reservas.length;
      totalBloqueos += dayData.bloqueos.length;

      if (!hasReservas && !hasBloqueos) {
        freeDays += 1;
      } else if (hasReservas && !hasBloqueos) {
        reservaDays += 1;
      } else if (!hasReservas && hasBloqueos) {
        bloqueadoDays += 1;
      } else if (hasReservas && hasBloqueos) {
        mixedDays += 1;
      }
    }

    return {
      totalReservas,
      totalBloqueos,
      freeDays,
      reservaDays,
      bloqueadoDays,
      mixedDays,
    };
  }, [cells, data]);

  return (
    <AdminPage title="Calendari">
      {/* Barra superior: selector de mes + meta info */}
      <div className="flex flex-col gap-3 rounded-2xl border admin-card-glass p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, -1))}
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
          >
            ← Mes anterior
          </button>
          <button
            type="button"
            onClick={() =>
              setMonthYear({
                year: today.getFullYear(),
                month: today.getMonth(),
              })
            }
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
          >
            Avui
          </button>
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, 1))}
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
          >
            Mes següent →
          </button>
          <div className="flex rounded-xl border overflow-hidden ml-2">
            <span
              className="inline-flex items-center px-3 py-2 text-sm font-medium bg-white/10"
            >
              Mes
            </span>
            <button
              type="button"
              onClick={() => router.push('/admin/calendario?view=week')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium transition-all hover:bg-white/10"
            >
              Setmana
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 text-sm md:items-end">
          <div className="text-base sm:text-lg font-semibold tracking-tight">
            {monthLabel(monthYear)}
          </div>
          <div className="text-sm">
            Dies visibles: <span className="font-medium">{visibleRangeLabel}</span>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Carregant ocupació...
            </div>
          )}
          {error && (
            <div className="text-sm font-medium" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Stats ràpids del mes visible */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border p-3 sm:p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide">
                Reserves
              </span>
              <span className="text-2xl sm:text-3xl font-bold">
                {stats.totalReservas}
              </span>
            </div>
            <span className="rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
              {stats.reservaDays + stats.mixedDays} dies
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border p-3 sm:p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide">
                Bloquejos
              </span>
              <span className="text-2xl sm:text-3xl font-bold">
                {stats.totalBloqueos}
              </span>
            </div>
            <span className="rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
              {stats.bloqueadoDays + stats.mixedDays} dies
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border p-3 sm:p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide">
                Dies lliures
              </span>
              <span className="text-2xl sm:text-3xl font-bold">
                {stats.freeDays}
              </span>
            </div>
            <span className="rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
              Disponibles
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border p-3 sm:p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide">
                Dies mixtes
              </span>
              <span className="text-2xl sm:text-3xl font-bold">
                {stats.mixedDays}
              </span>
            </div>
            <span className="rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
              Reserva + bloqueig
            </span>
          </div>
        </div>
      </div>

      {/* Llegenda */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl border px-3 sm:px-4 py-2.5 text-sm">
        <span className="font-medium">Llegenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border" />
          <span className="text-xs sm:text-sm">Lliure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border" />
          <span className="text-xs sm:text-sm">Reserves</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border" />
          <span className="text-xs sm:text-sm">Bloquejat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border" />
          <span className="text-xs sm:text-sm">Mixt</span>
        </div>
      </div>

      {/* Capçalera de dies */}
      <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Graella del calendari */}
      <div className="admin-calendar-grid grid grid-cols-7 gap-[1px] overflow-hidden rounded-2xl border">
        {cells.map((cell) => {
          const dayData =
            data?.days?.[cell.key] ??
            ({ reservas: [], bloqueos: [] } as CalendarApiDay);

          const hasReservas = dayData.reservas.length > 0;
          const hasBloqueos = dayData.bloqueos.length > 0;

          let bgClass = 'bg-white/5';
          let hoverClass = 'hover:bg-white/10';
          if (hasReservas && !hasBloqueos) {
            bgClass = 'bg-emerald-600/30';
            hoverClass = 'hover:bg-emerald-600/40';
          } else if (!hasReservas && hasBloqueos) {
            bgClass = 'bg-rose-600/30';
            hoverClass = 'hover:bg-rose-600/40';
          } else if (hasReservas && hasBloqueos) {
            bgClass = 'bg-amber-600/30';
            hoverClass = 'hover:bg-amber-600/40';
          }

          const isSelected = selectedDateKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelectedDateKey(cell.key)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverDateKey(cell.key);
              }}
              onDragLeave={() => {
                if (dragOverDateKey === cell.key) setDragOverDateKey(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const bookingId = e.dataTransfer.getData('text/plain');
                setDragOverDateKey(null);
                if (bookingId) {
                  void moveBookingToDate(bookingId, cell.key);
                }
                setDraggingBookingId(null);
              }}
              className={[
                'admin-calendar-cell flex h-[132px] sm:h-[152px] md:h-[168px] flex-col overflow-hidden p-1.5 sm:p-2 text-left text-sm transition-all',
                bgClass,
                hoverClass,
                !cell.inCurrentMonth ? 'opacity-30' : '',
                isSelected
                  ? 'ring-2 ring-inset ring-cyan-400'
                  : '',
                dragOverDateKey === cell.key
                  ? 'ring-2 ring-inset ring-amber-400/70'
                  : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={[
                    'inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors',
                    isToday(cell.date)
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-white/70',
                  ].join(' ')}
                >
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="mt-1 flex-1 min-h-0 min-w-0 overflow-hidden">
                {hasReservas && (
                  <div className="space-y-0.5 text-[9px] sm:text-[10px] overflow-hidden">
                    {dayData.reservas.slice(0, 2).map((r) => (
                      <div
                        key={r.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', r.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingBookingId(r.id);
                        }}
                        onDragEnd={() => {
                          setDraggingBookingId(null);
                          setDragOverDateKey(null);
                        }}
                        className="rounded-md px-1 py-0.5 cursor-grab active:cursor-grabbing">
                        <div className="truncate font-semibold">
                          {r.leadId ? (
                            <Link
                              href={`/admin/leads/${r.leadId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="hover:underline"
                            >
                              {r.clienteNombre || 'Client'}
                            </Link>
                          ) : (
                            r.clienteNombre || 'Client'
                          )}
                        </div>
                        <div className="truncate">
                          {resolveTimeLabel(r)} · {resolveServiceLabel(r)}
                        </div>
                      </div>
                    ))}
                    {dayData.reservas.length > 2 && (
                      <div className="">+{dayData.reservas.length - 2} més</div>
                    )}
                  </div>
                )}

                {hasBloqueos && (
                  <div className="line-clamp-1 text-[9px] sm:text-[10px] mt-0.5">
                    {dayData.bloqueos[0].motivo || 'Bloquejat'}
                    {dayData.bloqueos.length > 1
                      ? ` (+${dayData.bloqueos.length - 1})`
                      : ''}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Panell de detalls */}
      {selectedDayData.date && (
        <div className="rounded-2xl border admin-card-glass p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold">
                {formatDateFull(selectedDayData.date)}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm">
                Detalls del dia i accions ràpides
              </p>
            </div>

            {selectedDayData.key && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/clientes?add=1&date=${selectedDayData.key}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all active:scale-[0.98]"
                >
                  + Nou client
                </Link>
                <Link
                  href={`/admin/bookings/new?date=${selectedDayData.key}`}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-lg transition-all active:scale-[0.98]"
                >
                  + Nova reserva
                </Link>
                {selectedDayData.payload?.bloqueos?.length ? (
                  <button
                    type="button"
                    onClick={() => unblockDay(selectedDayData.key!)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
                  >
                    Desbloquejar dia
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBlockForm((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/20 active:scale-[0.98]"
                  >
                    Bloquejar dia
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Formulari bloqueig inline */}
          {showBlockForm && selectedDayData.key && (
            <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="block-note" className="block text-xs font-medium mb-1">
                  Motiu del bloqueig (opcional)
                </label>
                <input
                  id="block-note"
                  type="text"
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="p.ex. Vacances, manteniment..."
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                />
              </div>
              <button
                type="button"
                disabled={blockingDate}
                onClick={() => blockDay(selectedDayData.key!, blockNote)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-rose-500 disabled:opacity-50 active:scale-[0.98]"
              >
                {blockingDate ? 'Bloquejant...' : 'Confirmar bloqueig'}
              </button>
              <button
                type="button"
                onClick={() => { setShowBlockForm(false); setBlockNote(''); }}
                className="inline-flex items-center rounded-xl border px-3 py-2 text-sm transition-all active:scale-[0.98]"
              >
                Cancel·lar
              </button>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Reserves */}
            <div className="flex flex-col">
              <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full" />
                Reserves ({selectedDayData.payload?.reservas?.length || 0})
              </h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                {selectedDayData.payload?.reservas?.length ? (
                  selectedDayData.payload.reservas.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border px-3 py-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">
                          {r.clienteNombre ?? 'Client sense nom'}
                        </div>
                        {r.estado && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            {r.estado}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs">
                        {r.ubicacion && (
                          <>
                            {r.ubicacion}
                            {' · '}
                          </>
                        )}
                        {resolveTimeLabel(r)} · {resolveServiceLabel(r)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/bookings/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-medium hover:underline"
                        >
                          Reserva →
                        </Link>
                        {r.leadId && (
                          <Link
                            href={`/admin/leads/${r.leadId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-medium hover:underline"
                          >
                            Entrada →
                          </Link>
                        )}
                        {r.customerId && (
                          <Link
                            href={`/admin/clientes/${r.customerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-medium hover:underline"
                          >
                            👤 Client →
                          </Link>
                        )}
                        {changingDateForBooking === r.id ? (
                          <input
                            type="date"
                            autoFocus
                            className="rounded-xl border border-white/20 bg-white/5 px-2 py-0.5 text-[10px]"
                            defaultValue={r.fechaEvento.slice(0, 10)}
                            onBlur={() => setChangingDateForBooking(null)}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              if (newDate && newDate !== r.fechaEvento.slice(0, 10)) {
                                void moveBookingToDate(r.id, newDate);
                                setChangingDateForBooking(null);
                              }
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => setChangingDateForBooking(r.id)}
                            className="rounded-xl border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white/10"
                          >
                            Canviar data
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed px-3 py-4 text-center text-sm">
                    Cap reserva en aquest dia
                  </div>
                )}
              </div>
            </div>

            {/* Bloquejos */}
            <div className="flex flex-col">
              <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full" />
                Bloquejos ({selectedDayData.payload?.bloqueos?.length || 0})
              </h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                {selectedDayData.payload?.bloqueos?.length ? (
                  selectedDayData.payload.bloqueos.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">
                          Bloqueig
                        </div>
                        <button
                          type="button"
                          onClick={() => unblockDay(b.fecha.slice(0, 10))}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white/10"
                        >
                          Desbloquejar
                        </button>
                      </div>
                      <div className="mt-1 text-xs">
                        {b.notas || b.motivo || 'Sense motiu especificat'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed px-3 py-4 text-center text-sm">
                    Dia no bloquejat
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedDayData.payload?.reservas?.[0] && (
            <div className="mt-4 rounded-xl border p-4">
              <h3 className="text-sm font-semibold">Fitxa de l&apos;esdeveniment</h3>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="">Client:</span> {selectedDayData.payload.reservas[0].clienteNombre || '-'}</p>
                <p><span className="">Horari:</span> {resolveTimeLabel(selectedDayData.payload.reservas[0])}</p>
                <p><span className="">Servei:</span> {resolveServiceLabel(selectedDayData.payload.reservas[0])}</p>
                <p><span className="">Ubicació:</span> {selectedDayData.payload.reservas[0].ubicacion || '-'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminPage>
  );
}

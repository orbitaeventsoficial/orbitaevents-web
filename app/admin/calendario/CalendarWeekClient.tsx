'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  days: Record<string, CalendarApiDay>;
};

const CALENDAR_EVENT_LABELS: Record<string, string> = {
  ...EVENT_TYPE_PLAIN,
  CELEBRATION: 'Celebració',
};

const weekdayLabels = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

function formatKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekDays(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - mondayOffset);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

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
  return '';
}

export default function CalendarWeekClient() {
  const toast = useToast();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [baseDate, setBaseDate] = useState<Date>(today);
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [blockingDate, setBlockingDate] = useState<string | null>(null);
  const [blockNote, setBlockNote] = useState('');

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const fromStr = useMemo(() => formatKey(weekDays[0]), [weekDays]);
  const toStr = useMemo(() => {
    const end = new Date(weekDays[6]);
    end.setDate(end.getDate() + 1);
    return formatKey(end);
  }, [weekDays]);

  const weekLabel = useMemo(() => {
    const from = weekDays[0];
    const to = weekDays[6];
    return `${formatDateShort(from)} – ${formatDateShort(to)}`;
  }, [weekDays]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/calendario/mes?from=${fromStr}&to=${toStr}`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = (await res.json()) as CalendarApiResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error carregant');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [fromStr, toStr, refreshKey]);

  const navigateWeek = useCallback((delta: number) => {
    setBaseDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7 * delta);
      return d;
    });
  }, []);

  const blockDay = useCallback(async (dateKey: string, note?: string) => {
    try {
      const res = await fetchWithCsrf('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: `${dateKey}T12:00:00.000Z`, note: note || null }),
      });
      if (!res.ok) throw new Error('Error bloquejant dia');
      toast.success(`Dia ${formatDateShort(dateKey)} bloquejat`);
      setRefreshKey((k) => k + 1);
      setBlockingDate(null);
      setBlockNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error bloquejant dia');
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

  // Stats de la setmana
  const stats = useMemo(() => {
    let reservas = 0;
    let bloqueos = 0;
    for (const day of weekDays) {
      const key = formatKey(day);
      const dayData = data?.days?.[key];
      if (dayData) {
        reservas += dayData.reservas.length;
        bloqueos += dayData.bloqueos.length;
      }
    }
    return { reservas, bloqueos };
  }, [weekDays, data]);

  return (
    <AdminPage title="Calendari">
      {/* Barra superior */}
      <div className="flex flex-col gap-3 rounded-2xl border admin-card-glass p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateWeek(-1)}
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
          >
            ← Setmana anterior
          </button>
          <button
            type="button"
            onClick={() => setBaseDate(new Date())}
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
          >
            Avui
          </button>
          <button
            type="button"
            onClick={() => navigateWeek(1)}
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
          >
            Setmana següent →
          </button>
          <div className="flex rounded-xl border overflow-hidden ml-2">
            <button
              type="button"
              onClick={() => router.push('/admin/calendario?view=month')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium transition-all hover:bg-white/10"
            >
              Mes
            </button>
            <span
              className="inline-flex items-center px-3 py-2 text-sm font-medium bg-white/10"
            >
              Setmana
            </span>
            <button
              type="button"
              onClick={() => router.push('/admin/calendario?view=day')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium transition-all hover:bg-white/10"
            >
              Dia
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 text-sm md:items-end">
          <div className="text-base sm:text-lg font-semibold tracking-tight">
            {weekLabel}
          </div>
          <div className="text-sm">
            {stats.reservas} reserves · {stats.bloqueos} bloquejos
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Carregant...
            </div>
          )}
          {error && (
            <div className="text-sm font-medium" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Graella setmanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const key = formatKey(day);
          const dayData = data?.days?.[key] ?? { reservas: [], bloqueos: [] };
          const hasReservas = dayData.reservas.length > 0;
          const hasBloqueos = dayData.bloqueos.length > 0;
          const todayClass = isToday(day);

          return (
            <div
              key={key}
              className={[
                'flex flex-col rounded-2xl border p-3 min-h-[280px] transition-all',
                hasBloqueos ? 'border-rose-500/30 bg-rose-500/5' : '',
                hasReservas && !hasBloqueos ? 'border-emerald-500/20 bg-emerald-500/5' : '',
                !hasReservas && !hasBloqueos ? '' : '',
                todayClass ? 'ring-2 ring-cyan-400/50' : '',
              ].join(' ')}
            >
              {/* Capçalera del dia */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      todayClass
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-white/70',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                  <span className="text-xs font-medium text-white/50 hidden sm:inline">
                    {weekdayLabels[(day.getDay() + 6) % 7]}
                  </span>
                </div>
                {hasBloqueos ? (
                  <button
                    type="button"
                    onClick={() => unblockDay(key)}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    Desbloquejar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBlockingDate(blockingDate === key ? null : key)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white/10"
                  >
                    Bloquejar
                  </button>
                )}
              </div>

              {/* Formulari bloqueig inline */}
              {blockingDate === key && (
                <div className="mb-2 flex flex-col gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2">
                  <input
                    type="text"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                    placeholder="Motiu..."
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500/50"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => blockDay(key, blockNote)}
                      className="flex-1 rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-rose-500"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBlockingDate(null); setBlockNote(''); }}
                      className="rounded-lg border px-2 py-1 text-[10px]"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Bloquejos */}
              {hasBloqueos && dayData.bloqueos.map((b) => (
                <div
                  key={b.id}
                  className="mb-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-2 text-xs"
                >
                  <div className="font-semibold text-rose-400">Bloquejat</div>
                  {(b.notas || b.motivo) && (
                    <div className="mt-0.5 text-white/60">{b.notas || b.motivo}</div>
                  )}
                </div>
              ))}

              {/* Reserves */}
              <div className="flex-1 space-y-1.5 overflow-auto">
                {dayData.reservas.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/bookings/${r.id}`}
                    className="block rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2 transition-all hover:bg-emerald-500/20"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate">
                        {r.clienteNombre || 'Client'}
                      </span>
                      {r.estado && (
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-white/10">
                          {r.estado}
                        </span>
                      )}
                    </div>
                    {resolveTimeLabel(r) && (
                      <div className="text-[10px] text-white/60 mt-0.5">
                        {resolveTimeLabel(r)}
                      </div>
                    )}
                    <div className="text-[10px] text-white/50 mt-0.5 truncate">
                      {resolveServiceLabel(r)}
                      {r.ubicacion ? ` · ${r.ubicacion}` : ''}
                    </div>
                  </Link>
                ))}
                {!hasReservas && !hasBloqueos && (
                  <div className="flex items-center justify-center h-full text-xs text-white/20">
                    Lliure
                  </div>
                )}
              </div>

              {/* Accions ràpides */}
              <div className="mt-2 pt-2 border-t border-white/5 flex gap-1">
                <Link
                  href={`/admin/bookings/new?date=${key}`}
                  className="flex-1 text-center rounded-lg border border-white/10 bg-white/5 py-1 text-[10px] font-medium transition-colors hover:bg-white/10"
                >
                  + Reserva
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </AdminPage>
  );
}

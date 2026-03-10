'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EVENT_TYPE_PLAIN, formatDateFull, DEFAULT_LOCALE } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

type Booking = {
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
};

type Blockage = {
  id: string;
  fecha: string;
  motivo?: string | null;
  notas?: string | null;
};

type CalendarApiDay = {
  reservas: Booking[];
  bloqueos: Blockage[];
};

type CalendarApiResponse = {
  days: Record<string, CalendarApiDay>;
};

const CALENDAR_EVENT_LABELS: Record<string, string> = {
  ...EVENT_TYPE_PLAIN,
  CELEBRATION: 'Celebració',
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pendent', cls: 'bg-amber-500/20 text-amber-300' },
  CONFIRMED: { label: 'Confirmat', cls: 'bg-emerald-500/20 text-emerald-300' },
  PREPARING: { label: 'Preparant', cls: 'bg-blue-500/20 text-blue-300' },
  COMPLETED: { label: 'Completat', cls: 'bg-white/10 text-white/50' },
  CANCELLED: { label: 'Cancel·lat', cls: 'bg-rose-500/20 text-rose-300' },
};

function formatKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function resolveServiceLabel(booking: Booking): string {
  const pack = booking.packName?.trim();
  if (pack) return pack;
  const eventType = booking.eventType?.trim();
  if (eventType && CALENDAR_EVENT_LABELS[eventType]) return CALENDAR_EVENT_LABELS[eventType];
  if (eventType) return eventType;
  return 'Servei';
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 – 23:00

function parseHour(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const m = timeStr.match(/^(\d{1,2})/);
  return m ? parseInt(m[1], 10) : null;
}

export default function CalendarDayClient() {
  const toast = useToast();
  const router = useRouter();
  const todayDate = useMemo(() => new Date(), []);

  const [currentDate, setCurrentDate] = useState<Date>(todayDate);
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [blockNote, setBlockNote] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);

  const dateKey = useMemo(() => formatKey(currentDate), [currentDate]);
  const nextDay = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    return formatKey(d);
  }, [currentDate]);

  const dayData = useMemo((): CalendarApiDay => {
    if (!data?.days?.[dateKey]) return { reservas: [], bloqueos: [] };
    return data.days[dateKey];
  }, [data, dateKey]);

  const isBlocked = dayData.bloqueos.length > 0;
  const isTodayDate = isToday(currentDate);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithCsrf(`/api/admin/calendario/mes?from=${dateKey}&to=${nextDay}`);
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
  }, [dateKey, nextDay, refreshKey]);

  const navigateDay = useCallback((delta: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  const blockDay = useCallback(async (note?: string) => {
    try {
      const res = await fetchWithCsrf('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: `${dateKey}T12:00:00.000Z`, note: note || null }),
      });
      if (!res.ok) throw new Error('Error bloquejant dia');
      toast.success('Dia bloquejat');
      setRefreshKey((k) => k + 1);
      setShowBlockForm(false);
      setBlockNote('');
    } catch {
      toast.error('Error bloquejant dia');
    }
  }, [dateKey, toast]);

  const unblockDay = useCallback(async () => {
    try {
      const res = await fetchWithCsrf(`/api/admin/availability?date=${dateKey}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error desbloquejant dia');
      toast.success('Dia desbloquejat');
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error('Error desbloquejant dia');
    }
  }, [dateKey, toast]);

  const dayLabel = formatDateFull(currentDate).replace(/^\w/, (c) => c.toUpperCase());
  const weekdayLabel = currentDate.toLocaleDateString(DEFAULT_LOCALE, { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase());

  // Build timeline data
  const timelineBookings = useMemo(() => {
    return dayData.reservas.map((b) => {
      const startH = parseHour(b.eventStartTime);
      const endH = parseHour(b.eventEndTime);
      return { ...b, startH, endH };
    });
  }, [dayData.reservas]);

  return (
    <AdminPage
      title={`${weekdayLabel}, ${dayLabel}`}
      subtitle={`Vista diària ${isTodayDate ? '(avui)' : ''}`}
      back={{ href: '/admin/calendario', label: 'Calendari' }}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay(-1)}
            type="button"
            className="px-3 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            ← Dia anterior
          </button>
          <button
            onClick={goToToday}
            type="button"
            className="px-3 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            Avui
          </button>
          <button
            onClick={() => navigateDay(1)}
            type="button"
            className="px-3 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            Dia següent →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/calendario?view=week"
            className="px-3 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            Setmana
          </Link>
          <Link
            href="/admin/calendario"
            className="px-3 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            Mes
          </Link>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-sm mb-6">
          {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline column */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className={`px-5 py-3 border-b border-white/10 flex items-center justify-between ${isBlocked ? 'bg-rose-500/10' : isTodayDate ? 'bg-cyan-500/10' : 'bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2">
                  {isBlocked && <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />}
                  {!isBlocked && dayData.reservas.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
                  {!isBlocked && dayData.reservas.length === 0 && <span className="w-2.5 h-2.5 rounded-full bg-white/20" />}
                  <span className="text-sm font-medium">
                    {isBlocked ? 'Dia bloquejat' : `${dayData.reservas.length} reserv${dayData.reservas.length === 1 ? 'a' : 'es'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isBlocked ? (
                    <button onClick={unblockDay} type="button" className="text-xs px-3 py-1 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-colors">
                      Desbloquejar
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlockForm(!showBlockForm)}
                      type="button"
                      className="text-xs px-3 py-1 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 transition-colors"
                    >
                      Bloquejar dia
                    </button>
                  )}
                  <Link
                    href={`/admin/bookings/new?date=${dateKey}`}
                    className="text-xs px-3 py-1 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  >
                    + Nova reserva
                  </Link>
                </div>
              </div>

              {showBlockForm && (
                <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
                  <input
                    type="text"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                    placeholder="Motiu del bloqueig (opcional)"
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  />
                  <button
                    onClick={() => blockDay(blockNote)}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-sm font-medium hover:bg-rose-500/30 transition-colors"
                  >
                    Bloquejar
                  </button>
                  <button
                    onClick={() => { setShowBlockForm(false); setBlockNote(''); }}
                    type="button"
                    className="px-3 py-2 rounded-xl text-white/40 text-sm hover:bg-white/5 transition-colors"
                  >
                    Cancel·lar
                  </button>
                </div>
              )}

              {/* Timeline grid */}
              <div className="relative">
                {HOURS.map((hour) => {
                  const bookingsAtHour = timelineBookings.filter((b) => {
                    if (b.startH === null) return false;
                    const end = b.endH ?? b.startH + 4;
                    return hour >= b.startH && hour < end;
                  });

                  return (
                    <div key={hour} className="flex border-b border-white/5 min-h-[48px]">
                      <div className="w-16 flex-shrink-0 px-3 py-2 text-xs text-white/30 text-right border-r border-white/5">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 flex items-stretch gap-1 px-2 py-1">
                        {bookingsAtHour.map((b) => {
                          const badge = STATUS_BADGES[b.estado || ''] || STATUS_BADGES.PENDING;
                          return (
                            <Link
                              key={`${b.id}-${hour}`}
                              href={`/admin/bookings/${b.id}`}
                              className={`flex-1 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                                b.startH === hour ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-cyan-500/5 border border-cyan-500/10'
                              }`}
                            >
                              {b.startH === hour && (
                                <>
                                  <span className="font-medium text-white/80">{resolveServiceLabel(b)}</span>
                                  {b.clienteNombre && <span className="text-white/40 ml-2">{b.clienteNombre}</span>}
                                </>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Bookings without time */}
                {timelineBookings.filter((b) => b.startH === null).length > 0 && (
                  <div className="border-t border-white/10 px-5 py-3 bg-white/[0.02]">
                    <p className="text-xs text-white/30 mb-2">Sense hora definida:</p>
                    {timelineBookings.filter((b) => b.startH === null).map((b) => (
                      <Link
                        key={b.id}
                        href={`/admin/bookings/${b.id}`}
                        className="block px-3 py-2 rounded-xl border border-white/10 mb-1 hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-sm font-medium">{resolveServiceLabel(b)}</span>
                        {b.clienteNombre && <span className="text-xs text-white/40 ml-2">{b.clienteNombre}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail sidebar */}
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-2xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold mb-3 text-white/70">Resum del dia</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Reserves</span>
                  <span className="font-medium">{dayData.reservas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Bloquejos</span>
                  <span className="font-medium">{dayData.bloqueos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Estat</span>
                  <span className={`font-medium ${isBlocked ? 'text-rose-300' : dayData.reservas.length > 0 ? 'text-emerald-300' : 'text-white/50'}`}>
                    {isBlocked ? 'Bloquejat' : dayData.reservas.length > 0 ? 'Ocupat' : 'Lliure'}
                  </span>
                </div>
              </div>
            </div>

            {/* Blockage details */}
            {dayData.bloqueos.length > 0 && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                <h3 className="text-sm font-semibold mb-2 text-rose-300">Bloquejos</h3>
                {dayData.bloqueos.map((b) => (
                  <div key={b.id} className="text-sm text-white/60">
                    {b.motivo || b.notas || 'Sense motiu'}
                  </div>
                ))}
              </div>
            )}

            {/* Booking details */}
            {dayData.reservas.map((b) => {
              const badge = STATUS_BADGES[b.estado || ''] || STATUS_BADGES.PENDING;
              return (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="block rounded-2xl border border-white/10 p-5 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{resolveServiceLabel(b)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  {b.clienteNombre && (
                    <p className="text-sm text-white/60">{b.clienteNombre}</p>
                  )}
                  {b.ubicacion && (
                    <p className="text-xs text-white/40 mt-1">{b.ubicacion}</p>
                  )}
                  {(b.eventStartTime || b.eventEndTime) && (
                    <p className="text-xs text-white/40 mt-1">
                      {b.eventStartTime}{b.eventEndTime ? ` – ${b.eventEndTime}` : ''}
                    </p>
                  )}
                </Link>
              );
            })}

            {dayData.reservas.length === 0 && !isBlocked && (
              <div className="rounded-2xl border border-white/10 p-5 text-center">
                <p className="text-white/30 text-sm">Dia lliure</p>
                <Link
                  href={`/admin/bookings/new?date=${dateKey}`}
                  className="inline-block mt-3 px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-300 text-sm hover:bg-cyan-500/10 transition-colors"
                >
                  + Nova reserva
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminPage>
  );
}

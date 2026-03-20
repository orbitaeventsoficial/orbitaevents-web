'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateFull, DEFAULT_LOCALE } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CalendarApiDay, CalendarApiResponse } from './calendar-utils';
import { formatKey, isToday, resolveServiceLabel, STATUS_BADGES, HOURS, parseHour, getCalendarTone, getCalendarToneClasses } from './calendar-utils';

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
  const dayTone = getCalendarTone(dayData.reservas.length > 0, isBlocked);
  const dayToneClasses = getCalendarToneClasses(dayTone);

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
            className="ap-btn ap-btn--secondary text-sm"
          >
            ← Dia anterior
          </button>
          <button
            onClick={goToToday}
            type="button"
            className="ap-btn ap-btn--secondary text-sm"
          >
            Avui
          </button>
          <button
            onClick={() => navigateDay(1)}
            type="button"
            className="ap-btn ap-btn--secondary text-sm"
          >
            Dia següent →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/calendario?view=week"
            className="ap-btn ap-btn--secondary text-sm"
          >
            Setmana
          </Link>
          <Link
            href="/admin/calendario"
            className="ap-btn ap-btn--secondary text-sm"
          >
            Mes
          </Link>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-6">
          {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline column */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border admin-card-glass">
              <div className={`flex items-center justify-between border-b px-5 py-3 ${isTodayDate ? 'admin-card-glass' : ''} ${dayToneClasses.card}`}>
                <div className="flex items-center gap-2">
                  {isBlocked && <span className="w-2.5 h-2.5 rounded-full" />}
                  {!isBlocked && dayData.reservas.length > 0 && <span className="w-2.5 h-2.5 rounded-full" />}
                  {!isBlocked && dayData.reservas.length === 0 && <span className="h-2.5 w-2.5 rounded-full admin-tone-bg-neutral" />}
                  <span className="text-sm font-medium">
                    {isBlocked ? 'Dia bloquejat' : `${dayData.reservas.length} reserv${dayData.reservas.length === 1 ? 'a' : 'es'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isBlocked ? (
                    <button onClick={unblockDay} type="button" className="text-xs px-3 py-1 rounded-xl border transition-colors">
                      Desbloquejar
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlockForm(!showBlockForm)}
                      type="button"
                      className="ap-btn ap-btn--secondary text-xs"
                    >
                      Bloquejar dia
                    </button>
                  )}
                  <Link
                    href={`/admin/bookings/new?date=${dateKey}`}
                    className="text-xs px-3 py-1 rounded-xl border transition-colors"
                  >
                    + Nova reserva
                  </Link>
                </div>
              </div>

              {showBlockForm && (
                <div className="flex items-center gap-2 border-b px-5 py-3 admin-card-glass">
                  <input
                    type="text"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                    placeholder="Motiu del bloqueig (opcional)"
                    className="ap-input text-sm"
                  />
                  <button
                    onClick={() => blockDay(blockNote)}
                    type="button"
                    className="px-4 py-2 rounded-xl admin-tone-soft-danger text-sm font-medium transition-colors"
                  >
                    Bloquejar
                  </button>
                  <button
                    onClick={() => { setShowBlockForm(false); setBlockNote(''); }}
                    type="button"
                    className="rounded-xl px-3 py-2 text-sm transition-colors admin-tone-idle"
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
                      <div className="w-16 flex-shrink-0 border-r border-white/5 px-3 py-2 text-right text-xs">
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
                                b.startH === hour ? 'border admin-tone-soft-info admin-tone-border-info' : 'border admin-tone-idle'
                              }`}
                            >
                              {b.startH === hour && (
                                <>
                                  <span className="font-medium">{resolveServiceLabel(b)}</span>
                                  {b.clientName && <span className=" ml-2">{b.clientName}</span>}
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
                  <div className="border-t px-5 py-3 admin-card-glass">
                    <p className="mb-2 text-xs">Sense hora definida:</p>
                    {timelineBookings.filter((b) => b.startH === null).map((b) => (
                      <Link
                        key={b.id}
                        href={`/admin/bookings/${b.id}`}
                        className="mb-1 block rounded-xl border px-3 py-2 transition-colors admin-tone-idle"
                      >
                        <span className="text-sm font-medium">{resolveServiceLabel(b)}</span>
                        {b.clientName && <span className="text-xs  ml-2">{b.clientName}</span>}
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
            <div className="rounded-2xl border p-5 admin-card-glass">
              <h3 className="mb-3 text-sm font-semibold">Resum del dia</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="">Reserves</span>
                  <span className="font-medium">{dayData.reservas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Bloquejos</span>
                  <span className="font-medium">{dayData.bloqueos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Estat</span>
                  <span className={`font-medium ${dayToneClasses.text}`}>
                    {isBlocked ? 'Bloquejat' : dayData.reservas.length > 0 ? 'Ocupat' : 'Lliure'}
                  </span>
                </div>
              </div>
            </div>

            {/* Blockage details */}
            {dayData.bloqueos.length > 0 && (
              <div className="rounded-2xl border p-5">
                <h3 className="text-sm font-semibold mb-2">Bloquejos</h3>
                {dayData.bloqueos.map((b) => (
                  <div key={b.id} className="text-sm">
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
                  className="block rounded-2xl border p-5 transition-colors admin-card-glass"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{resolveServiceLabel(b)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  {b.clientName && (
                    <p className="text-sm">{b.clientName}</p>
                  )}
                  {b.ubicacion && (
                    <p className="text-xs  mt-1">{b.ubicacion}</p>
                  )}
                  {(b.eventStartTime || b.eventEndTime) && (
                    <p className="text-xs  mt-1">
                      {b.eventStartTime}{b.eventEndTime ? ` – ${b.eventEndTime}` : ''}
                    </p>
                  )}
                </Link>
              );
            })}

            {dayData.reservas.length === 0 && !isBlocked && (
              <div className="rounded-2xl border p-5 text-center admin-card-glass">
                <p className="text-sm">Dia lliure</p>
                <Link
                  href={`/admin/bookings/new?date=${dateKey}`}
                  className="mt-3 inline-flex ap-btn ap-btn--secondary text-sm"
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




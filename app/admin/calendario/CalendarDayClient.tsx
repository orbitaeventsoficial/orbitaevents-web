'use client';

import { getErrorMessage } from '@/lib/utils/errors';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';
import { useRouter } from 'next/navigation';
import { formatDateFull, formatWeekdayLong } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { ADMIN_CALENDAR_HELP, helpAttrs } from '../components/adminHelpContent';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CalendarApiDay, CalendarApiResponse } from './calendar-utils';
import { formatKey, isToday, HOURS, parseHour, getCalendarTone, getCalendarToneClasses, resolveWorkTimeLabel, getDayBolos, resolveBoloHref, resolveBoloServiceLabel, resolveBoloTimeLabel, resolveBoloStateLabel } from './calendar-utils';

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
    if (!data?.days?.[dateKey]) return { leads: [], reservas: [], bloqueos: [], tasks: [], socialPosts: [], followUps: [] };
    return data.days[dateKey];
  }, [data, dateKey]);
  const dayBolos = useMemo(() => getDayBolos(dayData), [dayData]);
  const bolosActius = useMemo(() => dayBolos.filter((bolo) => bolo.active), [dayBolos]);

  const isBlocked = dayData.bloqueos.length > 0;
  const isTodayDate = isToday(currentDate);
  const dayTone = getCalendarTone(
    bolosActius.some((bolo) => bolo.kind === 'BOOKING'),
    isBlocked
  );
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
        console.error('Error carregant dia del calendari', e);
        if (!cancelled) setError(getErrorMessage(e, 'Error carregant'));
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
    } catch (err) {
      console.error('Error bloquejant dia', err);
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
    } catch (err) {
      console.error('Error desbloquejant dia', err);
      toast.error('Error desbloquejant dia');
    }
  }, [dateKey, toast]);

  const dayLabel = formatDateFull(currentDate).replace(/^\w/, (c) => c.toUpperCase());
  const weekdayLabel = formatWeekdayLong(currentDate).replace(/^\w/, (c) => c.toUpperCase());

  // La linia de temps pinta tots els bolos del dia, siguin entrades o reserves.
  const timelineBolos = useMemo(() => {
    return dayBolos.map((bolo) => ({
      ...bolo,
      startH: parseHour(bolo.eventStartTime),
      endH: parseHour(bolo.eventEndTime),
    }));
  }, [dayBolos]);

  return (
    <AdminPage
      title={`${weekdayLabel}, ${dayLabel}`}
      subtitle={`Vista diària ${isTodayDate ? '(avui)' : ''}`}
      back={{ href: '/admin/calendario', label: 'Calendari' }}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6" {...helpAttrs(ADMIN_CALENDAR_HELP.dayNavigation)}>
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
            <div className="overflow-hidden rounded-2xl border admin-card-glass" {...helpAttrs(ADMIN_CALENDAR_HELP.dayTimeline)}>
              <div className={`flex items-center justify-between border-b px-5 py-3 ${isTodayDate ? 'admin-card-glass' : ''} ${dayToneClasses.card}`}>
                <div className="flex items-center gap-2">
                  {isBlocked && <span className="w-2.5 h-2.5 rounded-full" />}
                  {!isBlocked && bolosActius.length > 0 && <span className="w-2.5 h-2.5 rounded-full" />}
                  {!isBlocked && bolosActius.length === 0 && <span className="h-2.5 w-2.5 rounded-full admin-tone-bg-neutral" />}
                  <span className="text-sm font-medium">
                    {isBlocked ? 'Dia bloquejat' : `${dayBolos.length} bolo${dayBolos.length === 1 ? '' : 's'}${dayBolos.length !== bolosActius.length ? ` (${dayBolos.length - bolosActius.length} descartat${dayBolos.length - bolosActius.length === 1 ? '' : 's'})` : ''}`}
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
                  const bolosAtHour = timelineBolos.filter((bolo) => {
                    if (bolo.startH === null) return false;
                    const end = bolo.endH ?? bolo.startH + 4;
                    return hour >= bolo.startH && hour < end;
                  });

                  return (
                    <div key={hour} className="flex border-b border-white/5 min-h-[48px]">
                      <div className="w-16 flex-shrink-0 border-r border-white/5 px-3 py-2 text-right text-xs">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 flex items-stretch gap-1 px-2 py-1">
                        {bolosAtHour.map((bolo) => (
                          <Link
                            key={`${bolo.id}-${hour}`}
                            href={resolveBoloHref(bolo)}
                            className={[
                              'flex-1 rounded-lg px-3 py-1.5 text-xs transition-colors border',
                              bolo.startH === hour ? 'admin-tone-soft-info admin-tone-border-info' : 'admin-tone-idle',
                              bolo.active ? '' : 'opacity-55',
                            ].join(' ')}
                          >
                            {bolo.startH === hour && (
                              <>
                                <span className={`font-medium ${bolo.active ? '' : 'line-through'}`}>
                                  {resolveBoloServiceLabel(bolo)}
                                </span>
                                {bolo.title && <span className="ml-2">{bolo.title}</span>}
                                {!bolo.active && <span className="ml-2">· {resolveBoloStateLabel(bolo)}</span>}
                              </>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Bolos sense hora */}
                {timelineBolos.filter((bolo) => bolo.startH === null).length > 0 && (
                  <div className="border-t px-5 py-3 admin-card-glass">
                    <p className="mb-2 text-xs">Sense hora definida:</p>
                    {timelineBolos.filter((bolo) => bolo.startH === null).map((bolo) => (
                      <Link
                        key={bolo.id}
                        href={resolveBoloHref(bolo)}
                        className={`mb-1 block rounded-xl border px-3 py-2 transition-colors admin-tone-idle ${bolo.active ? '' : 'opacity-55'}`}
                      >
                        <span className={`text-sm font-medium ${bolo.active ? '' : 'line-through'}`}>
                          {resolveBoloServiceLabel(bolo)}
                        </span>
                        {bolo.title && <span className="text-xs ml-2">{bolo.title}</span>}
                        {!bolo.active && <span className="text-xs ml-2">· {resolveBoloStateLabel(bolo)}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail sidebar */}
          <div className="space-y-4" {...helpAttrs(ADMIN_CALENDAR_HELP.daySidebar)}>
            {/* Summary card */}
            <div className="rounded-2xl border p-5 admin-card-glass">
              <h3 className="mb-3 text-sm font-semibold">Resum del dia</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="">Bolos</span>
                  <span className="font-medium">{dayBolos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Descartats</span>
                  <span className="font-medium">{dayBolos.length - bolosActius.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Bloquejos</span>
                  <span className="font-medium">{dayData.bloqueos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Feina pendent</span>
                  <span className="font-medium">{dayData.tasks.length + dayData.socialPosts.length + dayData.followUps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Estat</span>
                  <span className={`font-medium ${dayToneClasses.text}`}>
                    {isBlocked ? 'Bloquejat' : bolosActius.length > 0 ? 'Ocupat' : 'Lliure'}
                  </span>
                </div>
              </div>
            </div>

            {dayBolos.length > 0 && (
              <div className="rounded-2xl border p-5 admin-card-glass">
                <h3 className="mb-3 text-sm font-semibold">Bolos del dia</h3>
                <div className="space-y-2">
                  {dayBolos.map((bolo) => {
                    const stateLabel = resolveBoloStateLabel(bolo);
                    return (
                      <Link
                        key={bolo.id}
                        href={resolveBoloHref(bolo)}
                        className={[
                          'block rounded-xl border px-3 py-2',
                          bolo.kind === 'LEAD' ? 'admin-tone-soft-info' : '',
                          bolo.active ? '' : 'opacity-55',
                        ].join(' ')}
                      >
                        <div className={`truncate text-sm font-medium ${bolo.active ? '' : 'line-through'}`}>
                          {bolo.kind === 'BOOKING' ? 'Reserva' : 'Entrada'} · {bolo.title}
                        </div>
                        <div className="mt-1 text-xs opacity-70">
                          {resolveBoloTimeLabel(bolo)} · {resolveBoloServiceLabel(bolo)}
                          {stateLabel ? ` · ${stateLabel}` : ''}
                        </div>
                        {bolo.location && (
                          <div className="mt-1 truncate text-xs opacity-70">{bolo.location}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {(dayData.tasks.length > 0 || dayData.socialPosts.length > 0 || dayData.followUps.length > 0) && (
              <div className="rounded-2xl border p-5 admin-card-glass">
                <h3 className="mb-3 text-sm font-semibold">Feina planificada</h3>
                <div className="space-y-2">
                  {dayData.tasks.map((task) => (
                    <Link key={task.id} href="/admin/tasks" className="block rounded-xl border px-3 py-2 admin-tone-soft-info">
                      <div className="truncate text-sm font-medium">✓ {task.title}</div>
                      <div className="mt-1 text-xs opacity-70">{resolveWorkTimeLabel(task.dueDate)} · {task.priority}</div>
                    </Link>
                  ))}
                  {dayData.socialPosts.map((post) => (
                    <Link key={post.id} href="/admin/social" className="block rounded-xl border px-3 py-2 admin-tone-soft-warning">
                      <div className="truncate text-sm font-medium">📣 {post.title}</div>
                      <div className="mt-1 text-xs opacity-70">{resolveWorkTimeLabel(post.scheduledAt)} · {post.platforms.join(', ')}</div>
                    </Link>
                  ))}
                  {dayData.followUps.map((item) => (
                    <Link
                      key={item.leadId}
                      href={buildLeadCustomerHref({
                        leadId: item.leadId,
                        customerId: item.customerId,
                        customerTab: 'comms',
                      })}
                      className="block rounded-xl border admin-tone-border-danger admin-tone-bg-danger px-3 py-2"
                    >
                      <div className="truncate text-sm font-medium">☎ Follow-up · {item.name}</div>
                      <div className="mt-1 text-xs opacity-70">{item.urgency} · {item.suggestedAction}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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

            {dayBolos.length === 0 && !isBlocked && dayData.tasks.length === 0 && dayData.socialPosts.length === 0 && dayData.followUps.length === 0 && (
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

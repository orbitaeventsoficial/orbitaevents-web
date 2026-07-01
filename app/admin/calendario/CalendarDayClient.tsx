'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { formatDateFull, formatWeekdayLong, getBookingStatusBadgeDisplay } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { ADMIN_CALENDAR_HELP, helpAttrs } from '../components/adminHelpContent';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CalendarApiDay, CalendarApiResponse } from './calendar-utils';
import { formatKey, isToday, resolveServiceLabel, HOURS, parseHour, getCalendarTone, getCalendarToneClasses, resolveWorkTimeLabel } from './calendar-utils';

type CalendarLayer = 'bookings' | 'blocks' | 'leads' | 'tasks' | 'social' | 'followUps';

export default function CalendarDayClient() {
  const toast = useToast();
  const todayDate = useMemo(() => new Date(), []);

  const [currentDate, setCurrentDate] = useState<Date>(todayDate);
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [blockNote, setBlockNote] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({ bookings: true, blocks: true, leads: true, tasks: true, social: true, followUps: true });

  const dateKey = useMemo(() => formatKey(currentDate), [currentDate]);
  const toggleLayer = useCallback((layer: CalendarLayer) => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);
  const nextDay = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    return formatKey(d);
  }, [currentDate]);

  const dayData = useMemo((): CalendarApiDay => {
    if (!data?.days?.[dateKey]) return { leads: [], reservas: [], bloqueos: [], tasks: [], socialPosts: [], followUps: [] };
    return data.days[dateKey];
  }, [data, dateKey]);
  const dayLeads = dayData.leads ?? [];

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
        console.error('Error carregant dia del calendari', e);
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

  // Build timeline data
  const timelineBookings = useMemo(() => {
    return dayData.reservas.map((b) => {
      const startH = parseHour(b.eventStartTime);
      const endH = parseHour(b.eventEndTime);
      return { ...b, startH, endH };
    });
  }, [dayData.reservas]);

  const visibleTimelineBookings = useMemo(() => {
    return visibleLayers.bookings ? timelineBookings : [];
  }, [timelineBookings, visibleLayers.bookings]);

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


      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border admin-card-glass px-3 py-2 text-xs">
        <span className="font-semibold opacity-60">Capes:</span>
        {[
          ['bookings', 'Reserves'],
          ['leads', 'Entrades'],
          ['blocks', 'Bloquejos'],
          ['tasks', 'Tasques'],
          ['social', 'Social'],
          ['followUps', 'Follow-ups'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleLayer(key as CalendarLayer)}
            className={`rounded-full border px-2.5 py-1 font-medium transition-colors ${visibleLayers[key as keyof typeof visibleLayers] ? 'bg-[var(--raised)] border-[var(--line)]' : 'border-[var(--line)] opacity-45'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="ap-card p-4 text-sm mb-6">
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
                  {!isBlocked && dayData.reservas.length > 0 && <span className="w-2.5 h-2.5 rounded-full" />}
                  {!isBlocked && dayData.reservas.length === 0 && <span className="h-2.5 w-2.5 rounded-full admin-tone-bg-neutral" />}
                  <span className="text-sm font-medium">
                    {isBlocked ? 'Dia bloquejat' : `${dayData.reservas.length} reserv${dayData.reservas.length === 1 ? 'a' : 'es'} · ${dayLeads.length} entrad${dayLeads.length === 1 ? 'a' : 'es'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isBlocked ? (
                    <button onClick={unblockDay} type="button" className="ap-btn ap-btn--xs">
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
                  const bookingsAtHour = visibleTimelineBookings.filter((b) => {
                    if (b.startH === null) return false;
                    const end = b.endH ?? b.startH + 4;
                    return hour >= b.startH && hour < end;
                  });

                  return (
                    <div key={hour} className="flex border-b border-[var(--line)] min-h-[48px]">
                      <div className="w-16 flex-shrink-0 border-r border-[var(--line)] px-3 py-2 text-right text-xs">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 flex items-stretch gap-1 px-2 py-1">
                        {bookingsAtHour.map((b) => {
                          const badge = getBookingStatusBadgeDisplay(b.estado || '');
                          return (
                            <Link
                              key={`${b.id}-${hour}`}
                              href={buildBookingHref(b.id)}
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
                {visibleTimelineBookings.filter((b) => b.startH === null).length > 0 && (
                  <div className="border-t px-5 py-3 admin-card-glass">
                    <p className="mb-2 text-xs">Sense hora definida:</p>
                    {visibleTimelineBookings.filter((b) => b.startH === null).map((b) => (
                      <Link
                        key={b.id}
                        href={buildBookingHref(b.id)}
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
          <div className="space-y-4" {...helpAttrs(ADMIN_CALENDAR_HELP.daySidebar)}>
            {/* Summary card */}
            <div className="ap-card p-5 admin-card-glass">
              <h3 className="mb-3 text-sm font-semibold">Resum del dia</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="">Reserves</span>
                  <span className="font-medium">{visibleLayers.bookings ? dayData.reservas.length : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Entrades</span>
                  <span className="font-medium">{visibleLayers.leads ? dayLeads.length : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Bloquejos</span>
                  <span className="font-medium">{visibleLayers.blocks ? dayData.bloqueos.length : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Feina pendent</span>
                  <span className="font-medium">{(visibleLayers.tasks ? dayData.tasks.length : 0) + (visibleLayers.social ? dayData.socialPosts.length : 0) + (visibleLayers.followUps ? dayData.followUps.length : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Estat</span>
                  <span className={`font-medium ${dayToneClasses.text}`}>
                    {isBlocked ? 'Bloquejat' : dayData.reservas.length > 0 ? 'Ocupat' : 'Lliure'}
                  </span>
                </div>
              </div>
            </div>

            {visibleLayers.leads && dayLeads.length > 0 && (
              <div className="ap-card p-5 admin-card-glass">
                <h3 className="mb-3 text-sm font-semibold">Entrades del web</h3>
                <div className="space-y-2">
                  {dayLeads.map((lead) => {
                    const isLost = lead.status === 'LOST';
                    return (
                    <Link
                      key={lead.id}
                      href={buildLeadCustomerHref({
                        leadId: lead.id,
                        customerId: lead.customerId,
                      })}
                      className={isLost
                        ? 'block rounded-lg border px-2 py-1.5 text-xs opacity-60'
                        : 'block rounded-xl border px-3 py-2 admin-tone-soft-info'}
                    >
                      <div className={isLost ? 'truncate font-medium' : 'truncate text-sm font-medium'}>
                        {isLost ? 'Perdut' : 'Nova entrada'} · {lead.name}
                      </div>
                      <div className={isLost ? 'mt-0.5 opacity-70' : 'mt-1 text-xs opacity-70'}>
                        {lead.eventStartTime || '--:--'}{lead.eventEndTime ? ` - ${lead.eventEndTime}` : ''}
                        {!isLost && lead.eventType ? ` · ${lead.eventType}` : ''}
                      </div>
                      {!isLost && lead.eventLocation && (
                        <div className="mt-1 truncate text-xs opacity-70">{lead.eventLocation}</div>
                      )}
                    </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {((visibleLayers.tasks && dayData.tasks.length > 0) || (visibleLayers.social && dayData.socialPosts.length > 0) || (visibleLayers.followUps && dayData.followUps.length > 0)) && (
              <div className="ap-card p-5 admin-card-glass">
                <h3 className="mb-3 text-sm font-semibold">Feina planificada</h3>
                <div className="space-y-2">
                  {visibleLayers.tasks && dayData.tasks.map((task) => (
                    <Link key={task.id} href="/admin/tasks" className="block rounded-xl border px-3 py-2 admin-tone-soft-info">
                      <div className="truncate text-sm font-medium">✓ {task.title}</div>
                      <div className="mt-1 text-xs opacity-70">{resolveWorkTimeLabel(task.dueDate)} · {task.priority}</div>
                    </Link>
                  ))}
                  {visibleLayers.social && dayData.socialPosts.map((post) => (
                    <Link key={post.id} href="/admin/social" className="block rounded-xl border px-3 py-2 admin-tone-soft-warning">
                      <div className="truncate text-sm font-medium">📣 {post.title}</div>
                      <div className="mt-1 text-xs opacity-70">{resolveWorkTimeLabel(post.scheduledAt)} · {post.platforms.join(', ')}</div>
                    </Link>
                  ))}
                  {visibleLayers.followUps && dayData.followUps.map((item) => (
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
            {visibleLayers.blocks && dayData.bloqueos.length > 0 && (
              <div className="ap-card p-5">
                <h3 className="text-sm font-semibold mb-2">Bloquejos</h3>
                {dayData.bloqueos.map((b) => (
                  <div key={b.id} className="text-sm">
                    {b.motivo || b.notas || 'Sense motiu'}
                  </div>
                ))}
              </div>
            )}

            {/* Booking details */}
            {visibleLayers.bookings && dayData.reservas.map((b) => {
              const badge = getBookingStatusBadgeDisplay(b.estado || '');
              return (
                <Link
                  key={b.id}
                  href={buildBookingHref(b.id)}
                  className="block ap-card p-5 transition-colors admin-card-glass"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{resolveServiceLabel(b)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
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

            {(visibleLayers.bookings ? dayData.reservas.length === 0 : true) && (!visibleLayers.blocks || !isBlocked) && (!visibleLayers.leads || dayLeads.length === 0) && (!visibleLayers.tasks || dayData.tasks.length === 0) && (!visibleLayers.social || dayData.socialPosts.length === 0) && (!visibleLayers.followUps || dayData.followUps.length === 0) && (
              <div className="ap-card p-5 text-center admin-card-glass">
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

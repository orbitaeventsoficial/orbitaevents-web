'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { useRouter } from 'next/navigation';
import { formatDateShort, formatDateFull } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { ADMIN_CALENDAR_HELP, helpAttrs } from '../components/adminHelpContent';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CalendarApiDay, CalendarApiResponse } from './calendar-utils';
import { weekdayLabelsFull as weekdayLabels, formatKey, getWeekDays, isToday, resolveServiceLabel, resolveTimeLabel, getCalendarTone, getCalendarToneClasses, resolveWorkTimeLabel } from './calendar-utils';

type CalendarLayer = 'bookings' | 'blocks' | 'leads' | 'tasks' | 'social' | 'followUps';

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
  const [visibleLayers, setVisibleLayers] = useState({ bookings: true, blocks: true, leads: true, tasks: true, social: true, followUps: true });

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const toggleLayer = useCallback((layer: CalendarLayer) => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

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
        const res = await fetchWithCsrf(`/api/admin/calendario/mes?from=${fromStr}&to=${toStr}`);
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
      console.error('Error bloquejant dia del calendari', err);
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
      console.error('Error desbloquejant dia del calendari', err);
      toast.error(err instanceof Error ? err.message : 'Error desbloquejant dia');
    }
  }, [toast]);

  // Stats de la setmana
  const stats = useMemo(() => {
    let reservas = 0;
    let bloqueos = 0;
    let leads = 0;
    let tasks = 0;
    let social = 0;
    let followUps = 0;
    for (const day of weekDays) {
      const key = formatKey(day);
      const dayData = data?.days?.[key];
      if (dayData) {
        reservas += dayData.reservas.length;
        bloqueos += dayData.bloqueos.length;
        leads += dayData.leads?.length ?? 0;
        tasks += dayData.tasks.length;
        social += dayData.socialPosts.length;
        followUps += dayData.followUps.length;
      }
    }
    return { reservas, bloqueos, leads, tasks, social, followUps };
  }, [weekDays, data]);

  return (
    <AdminPage title="Calendari" subtitle="Visualitza reserves, bloquejos i feina planificada per executar el negoci.">
      {/* Barra superior */}
      <div className="flex flex-col gap-3 rounded-2xl border admin-card-glass p-3 sm:p-4 md:flex-row md:items-center md:justify-between" {...helpAttrs(ADMIN_CALENDAR_HELP.weekNavigation)}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateWeek(-1)}
            className="ap-btn ap-btn--secondary text-sm"
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
              className="ap-btn ap-btn--secondary text-sm border-0"
            >
              Mes
            </button>
            <span
              className="ap-btn text-sm admin-tone-soft-info admin-tone-border-info admin-tone-text-info"
            >
              Setmana
            </span>
            <button
              type="button"
              onClick={() => router.push('/admin/calendario?view=day')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium transition-all hover:bg-[var(--raised)]"
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
            {stats.reservas} reserves · {stats.leads} entrades · {stats.bloqueos} bloquejos · {stats.tasks + stats.social + stats.followUps} feines
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


      <div className="flex flex-wrap items-center gap-2 rounded-xl border admin-card-glass px-3 py-2 text-xs">
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
      {/* Graella setmanal amb scroll controlat en mòbil */}
      <div className="overflow-x-auto rounded-2xl">
        <div className="grid min-w-[980px] grid-cols-7 gap-2 overflow-x-auto" {...helpAttrs(ADMIN_CALENDAR_HELP.weekGrid)}>
        {weekDays.map((day) => {
          const key = formatKey(day);
          const dayData = data?.days?.[key] ?? { leads: [], reservas: [], bloqueos: [], tasks: [], socialPosts: [], followUps: [] };
          const dayLeads = dayData.leads ?? [];
          const hasReservas = dayData.reservas.length > 0;
          const hasBloqueos = dayData.bloqueos.length > 0;
          const hasLeads = dayLeads.length > 0;
          const todayClass = isToday(day);
          const tone = getCalendarTone(hasReservas, hasBloqueos);
          const toneClasses = getCalendarToneClasses(tone);

          return (
            <div
              key={key}
              className={[
                'flex min-h-[280px] flex-col rounded-2xl border p-3 transition-all',
                toneClasses.card,
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
                        ? 'admin-tone-soft-info admin-tone-border-info admin-tone-text-info'
                        : '',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                  <span className="hidden text-xs font-medium sm:inline">
                    {weekdayLabels[(day.getDay() + 6) % 7]}
                  </span>
                </div>
                {hasBloqueos ? (
                  <button
                    type="button"
                    onClick={() => unblockDay(key)}
                    className="rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors"
                  >
                    Desbloquejar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBlockingDate(blockingDate === key ? null : key)}
                    className="rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors admin-tone-idle"
                  >
                    Bloquejar
                  </button>
                )}
              </div>

              {/* Formulari bloqueig inline */}
              {blockingDate === key && (
                <div className="mb-2 flex flex-col gap-1.5 rounded-xl border p-2">
                  <input
                    type="text"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                    placeholder="Motiu..."
                    className="ap-input px-2 py-1 text-xs"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => blockDay(key, blockNote)}
                      className="ap-btn ap-btn--primary ap-btn--xs flex-1 justify-center"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBlockingDate(null); setBlockNote(''); }}
                      className="ap-btn ap-btn--secondary text-xs"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Bloquejos */}
              {visibleLayers.blocks && hasBloqueos && dayData.bloqueos.map((b) => (
                <div
                  key={b.id}
                  className="mb-2 rounded-xl border px-2.5 py-2 text-xs admin-tone-soft-danger admin-tone-border-danger"
                >
                  <div className="font-semibold">Bloquejat</div>
                  {(b.notas || b.motivo) && (
                    <div className="mt-0.5 text-xs">{b.notas || b.motivo}</div>
                  )}
                </div>
              ))}

              {/* Reserves */}
              <div className="flex-1 space-y-1.5 overflow-auto">
                {visibleLayers.tasks && dayData.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/admin/tasks"
                    className="block rounded-xl border px-2.5 py-2 transition-all admin-card-glass admin-tone-soft-info"
                  >
                    <div className="truncate text-xs font-semibold">✓ {task.title}</div>
                    <div className="mt-0.5 text-xs opacity-70">{resolveWorkTimeLabel(task.dueDate)} · {task.priority}</div>
                  </Link>
                ))}
                {visibleLayers.social && dayData.socialPosts.map((post) => (
                  <Link
                    key={post.id}
                    href="/admin/social"
                    className="block rounded-xl border px-2.5 py-2 transition-all admin-card-glass admin-tone-soft-warning"
                  >
                    <div className="truncate text-xs font-semibold">📣 {post.title}</div>
                    <div className="mt-0.5 text-xs opacity-70">{resolveWorkTimeLabel(post.scheduledAt)} · {post.platforms.join(', ')}</div>
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
                    className="block rounded-xl border admin-tone-border-danger admin-tone-bg-danger px-2.5 py-2 transition-all"
                  >
                    <div className="truncate text-xs font-semibold">☎ {item.name}</div>
                    <div className="mt-0.5 text-xs opacity-70">{item.urgency}</div>
                  </Link>
                ))}
                {visibleLayers.leads && dayLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={buildLeadCustomerHref({
                      leadId: lead.id,
                      customerId: lead.customerId,
                    })}
                    className="block rounded-xl border px-2.5 py-2 transition-all admin-card-glass admin-tone-soft-info"
                  >
                    <div className="truncate text-xs font-semibold">Nova entrada · {lead.name}</div>
                    <div className="mt-0.5 text-xs opacity-70">
                      {lead.eventStartTime || '--:--'}{lead.eventEndTime ? ` - ${lead.eventEndTime}` : ''}
                      {lead.eventType ? ` · ${lead.eventType}` : ''}
                    </div>
                  </Link>
                ))}
                {visibleLayers.bookings && dayData.reservas.map((r) => (
                  <Link
                    key={r.id}
                    href={buildBookingHref(r.id)}
                    className="block rounded-xl border px-2.5 py-2 transition-all admin-card-glass"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate">
                        {r.clientName || 'Client'}
                      </span>
                      {r.estado && (
                        <span className="rounded-full px-1.5 py-0.5 text-xs font-semibold uppercase admin-tone-idle">
                          {r.estado}
                        </span>
                      )}
                    </div>
                    {resolveTimeLabel(r) && (
                      <div className="mt-0.5 text-xs">
                        {resolveTimeLabel(r)}
                      </div>
                    )}
                    <div className="mt-0.5 truncate text-xs">
                      {resolveServiceLabel(r)}
                      {r.ubicacion ? ` · ${r.ubicacion}` : ''}
                    </div>
                  </Link>
                ))}
                {(!visibleLayers.bookings || !hasReservas) && (!visibleLayers.blocks || !hasBloqueos) && (!visibleLayers.leads || !hasLeads) && (!visibleLayers.tasks || dayData.tasks.length === 0) && (!visibleLayers.social || dayData.socialPosts.length === 0) && (!visibleLayers.followUps || dayData.followUps.length === 0) && (
                  <div className="flex h-full items-center justify-center text-xs">
                    Lliure
                  </div>
                )}
              </div>

              {/* Accions ràpides */}
              <div className="mt-2 pt-2 border-t border-[var(--line)] flex gap-1">
                <Link
                  href={`/admin/bookings/new?date=${key}`}
                  className="flex-1 rounded-lg border py-1 text-center text-xs font-medium transition-colors admin-tone-idle"
                >
                  + Reserva
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </AdminPage>
  );
}

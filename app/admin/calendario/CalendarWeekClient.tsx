'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateShort, formatDateFull } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CalendarApiDay, CalendarApiResponse } from './calendar-utils';
import { weekdayLabelsFull as weekdayLabels, formatKey, getWeekDays, isToday, resolveServiceLabel, resolveTimeLabel, getCalendarTone, getCalendarToneClasses } from './calendar-utils';

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
    <AdminPage title="Calendari" subtitle="Visualitza reserves, bloquejos i disponibilitat per planificar events.">
      {/* Barra superior */}
      <div className="flex flex-col gap-3 rounded-2xl border admin-card-glass p-3 sm:p-4 md:flex-row md:items-center md:justify-between" data-help-title="Navegació setmanal" data-help-desc="Canvia de setmana, torna a avui o salta entre vistes mensual, setmanal i diària.">
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
      <div className="grid grid-cols-7 gap-2" data-help-title="Graella setmanal" data-help-desc="Cada columna representa un dia de la setmana amb reserves, bloquejos i accions ràpides per operar-hi.">
        {weekDays.map((day) => {
          const key = formatKey(day);
          const dayData = data?.days?.[key] ?? { reservas: [], bloqueos: [] };
          const hasReservas = dayData.reservas.length > 0;
          const hasBloqueos = dayData.bloqueos.length > 0;
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
                    className="rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-colors"
                  >
                    Desbloquejar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBlockingDate(blockingDate === key ? null : key)}
                    className="rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-colors admin-tone-idle"
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
                      className="flex-1 rounded-lg px-2 py-1 text-[10px] font-medium text-white"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBlockingDate(null); setBlockNote(''); }}
                      className="ap-btn ap-btn--secondary text-[10px]"
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
                {dayData.reservas.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/bookings/${r.id}`}
                    className="block rounded-xl border px-2.5 py-2 transition-all admin-card-glass"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate">
                        {r.clientName || 'Client'}
                      </span>
                      {r.estado && (
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase admin-tone-idle">
                          {r.estado}
                        </span>
                      )}
                    </div>
                    {resolveTimeLabel(r) && (
                      <div className="mt-0.5 text-[10px]">
                        {resolveTimeLabel(r)}
                      </div>
                    )}
                    <div className="mt-0.5 truncate text-[10px]">
                      {resolveServiceLabel(r)}
                      {r.ubicacion ? ` · ${r.ubicacion}` : ''}
                    </div>
                  </Link>
                ))}
                {!hasReservas && !hasBloqueos && (
                  <div className="flex h-full items-center justify-center text-xs">
                    Lliure
                  </div>
                )}
              </div>

              {/* Accions ràpides */}
              <div className="mt-2 pt-2 border-t border-white/5 flex gap-1">
                <Link
                  href={`/admin/bookings/new?date=${key}`}
                  className="flex-1 rounded-lg border py-1 text-center text-[10px] font-medium transition-colors admin-tone-idle"
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


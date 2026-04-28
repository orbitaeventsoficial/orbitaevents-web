'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateShort, formatDateFull } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { ADMIN_CALENDAR_HELP, helpAttrs } from '../components/adminHelpContent';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CalendarApiDay, CalendarApiResponse, MonthYear, CalendarCell } from './calendar-utils';
import { weekdayLabels, resolveServiceLabel, resolveTimeLabel, formatKey, getMonthDays, addMonths, monthLabel, isToday, getCalendarTone, getCalendarToneClasses, resolveWorkTimeLabel } from './calendar-utils';

type OwnerTone = 'info' | 'warning' | 'success';
type OwnerStripConfig = {
  system: {
    eyebrow: string;
    title: string;
    tone: OwnerTone;
    items: string[];
    emptyText: string;
  };
  manual: {
    eyebrow: string;
    title: string;
    tone: OwnerTone;
    items: string[];
    emptyText: string;
  };
  nextStep: {
    eyebrow: string;
    title: string;
    detail: string;
    href: string;
    ctaLabel: string;
    secondaryAction?: {
      href: string;
      label: string;
    };
  };
};

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
  const [visibleLayers, setVisibleLayers] = useState({ bookings: true, blocks: true, tasks: true, social: true, followUps: true });

  const toggleLayer = useCallback((layer: 'bookings' | 'blocks' | 'tasks' | 'social' | 'followUps') => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

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
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
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
        const res = await fetchWithCsrf(
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
        totalTasks: 0,
        totalSocialPosts: 0,
        workDays: 0,
      };
    }

    let totalReservas = 0;
    let totalBloqueos = 0;
    let freeDays = 0;
    let reservaDays = 0;
    let bloqueadoDays = 0;
    let mixedDays = 0;
    let totalTasks = 0;
    let totalSocialPosts = 0;
    let workDays = 0;

    for (const cell of cells) {
      const dayData =
        data?.days?.[cell.key] ??
        ({
          reservas: [],
          bloqueos: [],
          tasks: [],
          socialPosts: [],
          followUps: [],
        } as CalendarApiDay);

      const hasReservas = dayData.reservas.length > 0;
      const hasBloqueos = dayData.bloqueos.length > 0;
      const hasWork = dayData.tasks.length > 0 || dayData.socialPosts.length > 0;

      totalReservas += dayData.reservas.length;
      totalBloqueos += dayData.bloqueos.length;
      totalTasks += dayData.tasks.length;
      totalSocialPosts += dayData.socialPosts.length;
      if (hasWork) workDays += 1;

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
      totalTasks,
      totalSocialPosts,
      workDays,
    };
  }, [cells, data]);

  const strip = useMemo<OwnerStripConfig>(() => {
    const hiddenLayers = Object.entries(visibleLayers)
      .filter(([, visible]) => !visible)
      .map(([layer]) => layer);
    const selectedPayload = selectedDayData.payload;
    const selectedHasItems = selectedPayload
      ? selectedPayload.reservas.length +
          selectedPayload.bloqueos.length +
          selectedPayload.tasks.length +
          selectedPayload.socialPosts.length +
          selectedPayload.followUps.length
      : 0;

    const systemItems: string[] = [];
    systemItems.push(`${stats.totalReservas} reserves · ${stats.totalBloqueos} bloquejos al rang visible`);
    systemItems.push(`${stats.freeDays} dies lliures · ${stats.mixedDays} dies mixtes · ${stats.workDays} dies amb feina`);
    if (stats.totalTasks > 0 || stats.totalSocialPosts > 0) {
      systemItems.push(`${stats.totalTasks} tasques · ${stats.totalSocialPosts} posts socials`);
    }

    const manualItems: string[] = [];
    if (stats.mixedDays > 0) {
      manualItems.push(`${stats.mixedDays} ${stats.mixedDays === 1 ? 'dia mixt' : 'dies mixtes'} amb reserva i bloqueig`);
    }
    if (hiddenLayers.length > 0) {
      manualItems.push(`${hiddenLayers.length} ${hiddenLayers.length === 1 ? 'capa amagada' : 'capes amagades'} a la lectura actual`);
    }
    if (selectedDayData.key && selectedHasItems > 0) {
      manualItems.push(`${selectedHasItems} elements oberts al detall del ${formatDateShort(selectedDayData.key)}`);
    }
    if (showBlockForm && selectedDayData.key) {
      manualItems.push(`Bloqueig manual en preparació per al ${formatDateShort(selectedDayData.key)}`);
    }
    if (draggingBookingId) {
      manualItems.push('Hi ha una reserva en moviment via drag & drop');
    }

    const nextStep =
      stats.mixedDays > 0
        ? {
            eyebrow: 'Següent pas · Conflicte',
            title: `Revisar ${stats.mixedDays} ${stats.mixedDays === 1 ? 'dia mixt' : 'dies mixtes'}`,
            detail: 'Els dies mixtes combinen reserva i bloqueig. Revisa el detall del calendari abans de moure o tancar disponibilitat.',
            href: '/admin/calendario?view=day',
            ctaLabel: 'Obrir vista dia',
            secondaryAction: { href: '/admin/calendario?view=week', label: 'Vista setmana' },
          }
        : stats.totalReservas === 0 && stats.totalBloqueos === 0
          ? {
              eyebrow: 'Següent pas · Disponibilitat',
              title: 'Calendari visible sense ocupació',
              detail: 'El rang visible no té reserves ni bloquejos. Pots bloquejar absències o preparar la propera planificació comercial.',
              href: '#calendar-detail',
              ctaLabel: 'Obrir detall',
            }
          : selectedDayData.key && selectedHasItems > 0
            ? {
                eyebrow: 'Següent pas · Dia obert',
                title: `Treballar el ${formatDateShort(selectedDayData.key)}`,
                detail: 'Ja tens un dia seleccionat amb activitat. Tanca moviments, bloquejos o accions ràpides des del panell de detall.',
                href: '#calendar-detail',
                ctaLabel: 'Anar al detall',
              }
            : {
                eyebrow: 'Següent pas',
                title: 'Ocupació visible sota control',
                detail: 'El mes visible no mostra conflictes forts. Si vols més precisió operativa, baixa a setmana o dia.',
                href: '/admin/calendario?view=week',
                ctaLabel: 'Obrir vista setmana',
                secondaryAction: { href: '/admin/calendario?view=day', label: 'Vista dia' },
              };

    return {
      system: {
        eyebrow: 'Automàtic · Ocupació',
        title: stats.totalReservas > 0 || stats.totalBloqueos > 0 ? 'Mapa d’ocupació visible' : 'Calendari visible buit',
        tone: stats.mixedDays > 0 ? 'warning' : stats.totalReservas > 0 || stats.totalBloqueos > 0 ? 'info' : 'success',
        items: systemItems,
        emptyText: 'Sense ocupació visible al rang carregat.',
      },
      manual: {
        eyebrow: 'Manual · Operativa',
        title: manualItems.length === 0 ? 'Cap tensió manual' : `${manualItems.length} senyals per revisar`,
        tone: stats.mixedDays > 0 || showBlockForm || draggingBookingId ? 'warning' : manualItems.length > 0 ? 'info' : 'success',
        items: manualItems,
        emptyText: 'Sense conflictes, capes amagades ni moviments manuals oberts.',
      },
      nextStep,
    };
  }, [
    draggingBookingId,
    selectedDayData.key,
    selectedDayData.payload,
    showBlockForm,
    stats,
    visibleLayers,
  ]);

  return (
    <AdminPage title="Calendari" subtitle="Visualitza reserves, bloquejos i feina planificada per executar el negoci.">
      <OwnerControlStrip
        system={strip.system}
        manual={strip.manual}
        nextStep={strip.nextStep}
      />

      {/* Barra superior: selector de mes + meta info */}
      <div className="flex flex-col gap-2 rounded-xl border admin-card-glass p-2.5 sm:p-3 md:flex-row md:items-center md:justify-between" {...helpAttrs(ADMIN_CALENDAR_HELP.monthNavigation)}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, -1))}
            className="inline-flex min-h-[40px] items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() =>
              setMonthYear({
                year: today.getFullYear(),
                month: today.getMonth(),
              })
            }
            className="ap-btn text-xs admin-tone-soft-warning admin-tone-border-warning admin-tone-text-warning"
          >
            Avui
          </button>
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, 1))}
            className="inline-flex min-h-[40px] items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            Mes següent →
          </button>
          <div className="ml-0 flex w-full flex-wrap overflow-hidden rounded-lg border sm:w-auto md:ml-2">
            <span className="inline-flex items-center border-r px-2.5 py-1.5 text-xs font-semibold admin-tone-soft-warning admin-tone-border-warning admin-tone-text-warning">
              Mes
            </span>
            <button
              type="button"
              onClick={() => router.push('/admin/calendario?view=week')}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center border-r px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-white/10 sm:flex-none"
            >
              Setmana
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/calendario?view=day')}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-white/10 sm:flex-none"
            >
              Dia
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


      <div className="flex flex-wrap items-center gap-2 rounded-xl border admin-card-glass px-3 py-2 text-xs">
        <span className="font-semibold opacity-60">Capes:</span>
        {[
          ['bookings', 'Reserves'],
          ['blocks', 'Bloquejos'],
          ['tasks', 'Tasques'],
          ['social', 'Social'],
          ['followUps', 'Follow-ups'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleLayer(key as 'bookings' | 'blocks' | 'tasks' | 'social' | 'followUps')}
            className={`rounded-full border px-2.5 py-1 font-medium transition-colors ${visibleLayers[key as keyof typeof visibleLayers] ? 'bg-white/10 border-white/20' : 'border-white/10 opacity-45'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* Stats ràpids del mes visible */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-6" {...helpAttrs(ADMIN_CALENDAR_HELP.stats)}>
        <div className="admin-card-glass rounded-xl border p-2.5 sm:p-3 transition-all admin-tone-soft-success admin-tone-border-success">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide admin-tone-text-success">Reserves</span>
              <span className="text-xl sm:text-2xl font-bold admin-tone-text-success">{stats.totalReservas}</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium admin-tone-soft-success admin-tone-border-success admin-tone-text-success">
              {stats.reservaDays + stats.mixedDays} dies
            </span>
          </div>
        </div>

        <div className="admin-card-glass rounded-xl border p-2.5 sm:p-3 transition-all admin-tone-soft-danger admin-tone-border-danger">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide admin-tone-text-danger">Bloquejos</span>
              <span className="text-xl sm:text-2xl font-bold admin-tone-text-danger">{stats.totalBloqueos}</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger">
              {stats.bloqueadoDays + stats.mixedDays} dies
            </span>
          </div>
        </div>

        <div className="admin-card-glass rounded-xl border p-2.5 sm:p-3 transition-all admin-tone-soft-info admin-tone-border-info">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide admin-tone-text-info">Dies lliures</span>
              <span className="text-xl sm:text-2xl font-bold admin-tone-text-info">{stats.freeDays}</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium admin-tone-soft-info admin-tone-border-info admin-tone-text-info">
              Disponibles
            </span>
          </div>
        </div>

        <div className="admin-card-glass rounded-xl border p-2.5 sm:p-3 transition-all admin-tone-soft-warning admin-tone-border-warning">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide admin-tone-text-warning">Dies mixtes</span>
              <span className="text-xl sm:text-2xl font-bold admin-tone-text-warning">{stats.mixedDays}</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium admin-tone-soft-warning admin-tone-border-warning admin-tone-text-warning">
              Reserva + bloqueig
            </span>
          </div>
        </div>

        <div className="admin-card-glass rounded-xl border p-2.5 sm:p-3 transition-all admin-tone-soft-info admin-tone-border-info">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide admin-tone-text-info">Tasques</span>
              <span className="text-xl sm:text-2xl font-bold admin-tone-text-info">{stats.totalTasks}</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium admin-tone-soft-info admin-tone-border-info admin-tone-text-info">
              {stats.workDays} dies
            </span>
          </div>
        </div>

        <div className="admin-card-glass rounded-xl border p-2.5 sm:p-3 transition-all admin-tone-soft-warning admin-tone-border-warning">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide admin-tone-text-warning">Social</span>
              <span className="text-xl sm:text-2xl font-bold admin-tone-text-warning">{stats.totalSocialPosts}</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium admin-tone-soft-warning admin-tone-border-warning admin-tone-text-warning">
              Posts
            </span>
          </div>
        </div>      </div>

      {/* Llegenda */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl admin-card-glass border px-3 sm:px-4 py-2 text-sm" {...helpAttrs(ADMIN_CALENDAR_HELP.legend)}>
        <span className="font-medium">Llegenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-white/15 border border-white/20" />
          <span className="text-xs sm:text-sm">Lliure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm admin-tone-soft-success admin-tone-border-success" />
          <span className="text-xs sm:text-sm">Reserves</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm admin-tone-soft-danger admin-tone-border-danger" />
          <span className="text-xs sm:text-sm">Bloquejat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm admin-tone-soft-warning admin-tone-border-warning" />
          <span className="text-xs sm:text-sm">Mixt</span>
        </div>
      </div>

      {/* Capçalera + graella amb scroll controlat en mòbil */}
      <div className="overflow-x-auto rounded-2xl">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 overflow-x-auto text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>

          {/* Graella del calendari */}
          <div className="admin-calendar-grid grid grid-cols-7 gap-[1px] overflow-y-hidden overflow-x-auto rounded-2xl border p-0" {...helpAttrs(ADMIN_CALENDAR_HELP.monthGrid)}>
        {cells.map((cell) => {
          const dayData =
            data?.days?.[cell.key] ??
            ({ reservas: [], bloqueos: [], tasks: [], socialPosts: [], followUps: [] } as CalendarApiDay);

          const hasReservas = dayData.reservas.length > 0;
          const hasBloqueos = dayData.bloqueos.length > 0;

          const tone = getCalendarTone(hasReservas, hasBloqueos);
          const toneClasses = getCalendarToneClasses(tone);
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
                'admin-calendar-cell flex h-[72px] sm:h-[80px] md:h-[88px] flex-col overflow-hidden p-1 text-left text-xs transition-all sm:p-1.5',
                toneClasses.card,
                !cell.inCurrentMonth ? 'opacity-30' : '',
                isSelected ? 'ring-2 ring-inset ring-cyan-400' : '',
                dragOverDateKey === cell.key ? 'ring-2 ring-inset ring-amber-400/70' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={[
                    'inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors',
                    isToday(cell.date)
                      ? 'admin-tone-soft-info admin-tone-border-info admin-tone-text-info'
                      : '',
                  ].join(' ')}
                >
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="mt-1 flex-1 min-h-0 min-w-0 overflow-hidden">
                {visibleLayers.bookings && hasReservas && (
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
                        className="cursor-grab rounded-md px-1 py-0.5 admin-tone-soft-success admin-tone-text-success active:cursor-grabbing">
                        <div className="truncate font-semibold">
                          {r.leadId ? (
                            <Link
                              href={buildLeadCustomerHref({
                                leadId: r.leadId,
                                customerId: r.customerId,
                              })}
                              onClick={(event) => event.stopPropagation()}
                              className="hover:underline"
                            >
                              {r.clientName || 'Client'}
                            </Link>
                          ) : (
                            r.clientName || 'Client'
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

                {visibleLayers.blocks && hasBloqueos && (
                  <div className="line-clamp-1 text-[9px] sm:text-[10px] mt-0.5 admin-tone-text-danger/80">
                    {dayData.bloqueos[0].motivo || 'Bloquejat'}
                    {dayData.bloqueos.length > 1
                      ? ` (+${dayData.bloqueos.length - 1})`
                      : ''}
                  </div>
                )}

                {visibleLayers.tasks && dayData.tasks.length > 0 && (
                  <div className="mt-0.5 truncate rounded-md px-1 py-0.5 text-[9px] sm:text-[10px] admin-tone-soft-info admin-tone-text-info">
                    ✓ {dayData.tasks[0].title}{dayData.tasks.length > 1 ? ` +${dayData.tasks.length - 1}` : ''}
                  </div>
                )}

                {visibleLayers.social && dayData.socialPosts.length > 0 && (
                  <div className="mt-0.5 truncate rounded-md px-1 py-0.5 text-[9px] sm:text-[10px] admin-tone-soft-warning admin-tone-text-warning">
                    📣 {dayData.socialPosts[0].title}{dayData.socialPosts.length > 1 ? ` +${dayData.socialPosts.length - 1}` : ''}
                  </div>
                )}

                {visibleLayers.followUps && dayData.followUps.length > 0 && (
                  <div className="mt-0.5 truncate rounded-md border border-rose-500/30 bg-rose-500/10 px-1 py-0.5 text-[9px] sm:text-[10px] text-rose-200">
                    ☎ {dayData.followUps[0].name}{dayData.followUps.length > 1 ? ` +${dayData.followUps.length - 1}` : ''}
                  </div>
                )}
              </div>
            </button>
          );
        })}
          </div>
        </div>
      </div>

      {/* Panell de detalls */}
      {selectedDayData.date && (
        <div id="calendar-detail" className="rounded-2xl border admin-card-glass p-4 sm:p-5" {...helpAttrs(ADMIN_CALENDAR_HELP.monthDayDetail)}>
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
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all active:scale-[0.98] sm:w-auto sm:px-4 sm:text-sm"
                >
                  + Nou client
                </Link>
                <Link
                  href={`/admin/bookings/new?date=${selectedDayData.key}`}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white shadow-lg transition-all active:scale-[0.98] sm:w-auto sm:px-4 sm:text-sm"
                >
                  + Nova reserva
                </Link>
                {selectedDayData.payload?.bloqueos?.length ? (
                  <button
                    type="button"
                    onClick={() => unblockDay(selectedDayData.key!)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all active:scale-[0.98] sm:w-auto sm:px-4 sm:text-sm"
                  >
                    Desbloquejar dia
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBlockForm((v) => !v)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all active:scale-[0.98] sm:w-auto sm:px-4 sm:text-sm"
                  >
                    Bloquejar dia
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Formulari bloqueig inline */}
          {showBlockForm && selectedDayData.key && (
            <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border p-3">
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
                  className="ap-input text-sm"
                />
              </div>
              <button
                type="button"
                disabled={blockingDate}
                onClick={() => blockDay(selectedDayData.key!, blockNote)}
                className="ap-btn ap-btn--primary min-h-[44px] w-full text-sm disabled:opacity-50 sm:w-auto"
              >
                {blockingDate ? 'Bloquejant...' : 'Confirmar bloqueig'}
              </button>
              <button
                type="button"
                onClick={() => { setShowBlockForm(false); setBlockNote(''); }}
                className="ap-btn ap-btn--secondary text-sm"
              >
                Cancel·lar
              </button>
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {visibleLayers.bookings && (
              <div className="flex flex-col">
                <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full" />
                  Reserves ({selectedDayData.payload?.reservas?.length || 0})
                </h3>
                <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                  {selectedDayData.payload?.reservas?.length ? (
                    selectedDayData.payload.reservas.map((r) => (
                      <div key={r.id} className="rounded-xl border px-3 py-2.5 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm">{r.clientName ?? 'Client sense nom'}</div>
                          {r.estado && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              {r.estado}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs">
                          {r.ubicacion && <>{r.ubicacion}{' · '}</>}
                          {resolveTimeLabel(r)} · {resolveServiceLabel(r)}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Link href={`/admin/bookings/${r.id}`} onClick={(e) => e.stopPropagation()} className="text-[10px] font-medium hover:underline">
                            Reserva →
                          </Link>
                          {r.leadId && (
                            <Link
                              href={buildLeadCustomerHref({
                                leadId: r.leadId,
                                customerId: r.customerId,
                              })}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-medium hover:underline"
                            >
                              {r.customerId ? 'Workspace →' : 'Entrada →'}
                            </Link>
                          )}
                          {r.customerId && (
                            <Link
                              href={buildCustomerWorkspaceTabHref(r.customerId, 'bookings')}
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
                              className="ap-input px-2 py-0.5 text-[10px]"
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
                            <button onClick={() => setChangingDateForBooking(r.id)} className="rounded-xl border px-2 py-0.5 text-[10px] font-medium transition-colors admin-tone-idle">
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
            )}

            {(visibleLayers.tasks || visibleLayers.social || visibleLayers.followUps) && (
              <div className="flex flex-col">
                <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full" />
                  Feina ({(visibleLayers.tasks ? (selectedDayData.payload?.tasks?.length || 0) : 0) + (visibleLayers.social ? (selectedDayData.payload?.socialPosts?.length || 0) : 0) + (visibleLayers.followUps ? (selectedDayData.payload?.followUps?.length || 0) : 0)})
                </h3>
                <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                  {visibleLayers.tasks && selectedDayData.payload?.tasks?.map((task) => (
                    <Link key={task.id} href="/admin/tasks" className="block rounded-xl border px-3 py-2.5 transition-all admin-card-glass">
                      <div className="truncate text-sm font-medium">{task.title}</div>
                      <div className="mt-1 text-xs opacity-70">Tasca · {resolveWorkTimeLabel(task.dueDate)} · {task.priority}</div>
                    </Link>
                  ))}
                  {visibleLayers.social && selectedDayData.payload?.socialPosts?.map((post) => (
                    <Link key={post.id} href="/admin/social" className="block rounded-xl border px-3 py-2.5 transition-all admin-card-glass">
                      <div className="truncate text-sm font-medium">{post.title}</div>
                      <div className="mt-1 text-xs opacity-70">Social · {resolveWorkTimeLabel(post.scheduledAt)} · {post.platforms.join(', ')}</div>
                    </Link>
                  ))}
                  {visibleLayers.followUps && selectedDayData.payload?.followUps?.map((item) => (
                    <Link
                      key={item.leadId}
                      href={buildLeadCustomerHref({
                        leadId: item.leadId,
                        customerId: item.customerId,
                        customerTab: 'comms',
                      })}
                      className="block rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-3 py-2.5 transition-all"
                    >
                      <div className="truncate text-sm font-medium">Follow-up · {item.name}</div>
                      <div className="mt-1 text-xs opacity-70">{item.urgency} · {item.suggestedAction}</div>
                    </Link>
                  ))}
                  {(!visibleLayers.tasks || !selectedDayData.payload?.tasks?.length) && (!visibleLayers.social || !selectedDayData.payload?.socialPosts?.length) && (!visibleLayers.followUps || !selectedDayData.payload?.followUps?.length) && (
                    <div className="rounded-xl border border-dashed px-3 py-4 text-center text-sm">
                      Cap feina planificada en aquest dia
                    </div>
                  )}
                </div>
              </div>
            )}

            {visibleLayers.blocks && (
              <div className="flex flex-col">
                <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full" />
                  Bloquejos ({selectedDayData.payload?.bloqueos?.length || 0})
                </h3>
                <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                  {selectedDayData.payload?.bloqueos?.length ? (
                    selectedDayData.payload.bloqueos.map((b) => (
                      <div key={b.id} className="rounded-xl border px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm">Bloqueig</div>
                          <button type="button" onClick={() => unblockDay(b.fecha.slice(0, 10))} className="rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-colors admin-tone-idle">
                            Desbloquejar
                          </button>
                        </div>
                        <div className="mt-1 text-xs">{b.notas || b.motivo || 'Sense motiu especificat'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed px-3 py-4 text-center text-sm">
                      Dia no bloquejat
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedDayData.payload?.reservas?.[0] && (
            <div className="mt-4 rounded-xl border p-4">
              <h3 className="text-sm font-semibold">Fitxa de l&apos;esdeveniment</h3>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="">Client:</span> {selectedDayData.payload.reservas[0].clientName || '-'}</p>
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type CalendarApiDay = {
  reservas: {
    id: string;
    leadId?: string | null;
    fechaEvento: string;
    clienteNombre?: string | null;
    ubicacion?: string | null;
    estado?: string | null;
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

function formatKey(date: Date): string {
  return date.toISOString().slice(0, 10);
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
  return new Intl.DateTimeFormat('ca-ES', {
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
  const today = useMemo(() => new Date(), []);
  const [monthYear, setMonthYear] = useState<MonthYear>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

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

    const visibleRangeLabel = `${firstVisible.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
    })} – ${lastVisible.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
    })}`;

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
  }, [fromStr, toStr]);

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
    <div className="space-y-4 sm:space-y-5">
      {/* Barra superior: selector de mes + meta info */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, -1))}
            className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-slate-600/50 hover:border-slate-500/50 active:scale-[0.98]"
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
            className="inline-flex items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/50 active:scale-[0.98]"
          >
            Avui
          </button>
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, 1))}
            className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-slate-600/50 hover:border-slate-500/50 active:scale-[0.98]"
          >
            Mes següent →
          </button>
        </div>

        <div className="flex flex-col items-start gap-1 text-sm md:items-end">
          <div className="text-base sm:text-lg font-semibold tracking-tight text-slate-100">
            {monthLabel(monthYear)}
          </div>
          <div className="text-sm text-slate-400">
            Dies visibles: <span className="font-medium text-slate-300">{visibleRangeLabel}</span>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-cyan-400" role="status" aria-live="polite">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Carregant ocupació...
            </div>
          )}
          {error && (
            <div className="text-sm font-medium text-rose-400" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Stats ràpids del mes visible */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-3 sm:p-4 transition-all hover:border-emerald-500/30 hover:from-emerald-500/15 hover:to-emerald-600/10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide text-emerald-400/80">
                Reserves
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-300">
                {stats.totalReservas}
              </span>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-emerald-300">
              {stats.reservaDays + stats.mixedDays} dies
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5 p-3 sm:p-4 transition-all hover:border-rose-500/30 hover:from-rose-500/15 hover:to-rose-600/10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide text-rose-400/80">
                Bloquejos
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-rose-300">
                {stats.totalBloqueos}
              </span>
            </div>
            <span className="rounded-full bg-rose-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-rose-300">
              {stats.bloqueadoDays + stats.mixedDays} dies
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-500/20 bg-gradient-to-br from-slate-500/10 to-slate-600/5 p-3 sm:p-4 transition-all hover:border-slate-500/30 hover:from-slate-500/15 hover:to-slate-600/10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400/80">
                Dies lliures
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-slate-300">
                {stats.freeDays}
              </span>
            </div>
            <span className="rounded-full bg-slate-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-slate-400">
              Disponibles
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-3 sm:p-4 transition-all hover:border-amber-500/30 hover:from-amber-500/15 hover:to-amber-600/10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase tracking-wide text-amber-400/80">
                Dies mixtes
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-amber-300">
                {stats.mixedDays}
              </span>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-amber-300">
              Reserva + bloqueig
            </span>
          </div>
        </div>
      </div>

      {/* Llegenda */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 sm:px-4 py-2.5 text-sm">
        <span className="font-medium text-slate-300">Llegenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-slate-600 bg-slate-800" />
          <span className="text-xs sm:text-sm text-slate-400">Lliure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-emerald-500/50 bg-emerald-500/20" />
          <span className="text-xs sm:text-sm text-slate-400">Reserves</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-rose-500/50 bg-rose-500/20" />
          <span className="text-xs sm:text-sm text-slate-400">Bloquejat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-amber-500/50 bg-amber-500/20" />
          <span className="text-xs sm:text-sm text-slate-400">Mixt</span>
        </div>
      </div>

      {/* Capçalera de dies */}
      <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Graella del calendari */}
      <div className="grid grid-cols-7 gap-[1px] overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-700/30">
        {cells.map((cell) => {
          const dayData =
            data?.days?.[cell.key] ??
            ({ reservas: [], bloqueos: [] } as CalendarApiDay);

          const hasReservas = dayData.reservas.length > 0;
          const hasBloqueos = dayData.bloqueos.length > 0;

          let bgClass = 'bg-slate-800/80';
          let hoverClass = 'hover:bg-slate-700/80';
          if (hasReservas && !hasBloqueos) {
            bgClass = 'bg-emerald-500/10';
            hoverClass = 'hover:bg-emerald-500/20';
          } else if (!hasReservas && hasBloqueos) {
            bgClass = 'bg-rose-500/10';
            hoverClass = 'hover:bg-rose-500/20';
          } else if (hasReservas && hasBloqueos) {
            bgClass = 'bg-amber-500/10';
            hoverClass = 'hover:bg-amber-500/20';
          }

          const isSelected = selectedDateKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelectedDateKey(cell.key)}
              className={[
                'flex min-h-[72px] sm:min-h-[88px] flex-col p-1.5 sm:p-2 text-left text-sm transition-all',
                bgClass,
                hoverClass,
                !cell.inCurrentMonth ? 'opacity-30' : '',
                isSelected
                  ? 'ring-2 ring-inset ring-cyan-400'
                  : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={[
                    'inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors',
                    isToday(cell.date)
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-slate-300',
                  ].join(' ')}
                >
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="mt-1 flex-1 min-w-0">
                {hasReservas && (
                  <div className="line-clamp-2 text-[9px] sm:text-[10px] font-medium text-emerald-300/90">
                    {dayData.reservas.slice(0, 2).map((r, index) => {
                      const label = r.clienteNombre || 'Client';
                      const separator = index > 0 ? ' · ' : '';
                      if (r.leadId) {
                        return (
                          <span key={r.id}>
                            {separator}
                            <Link
                              href={`/admin/leads/${r.leadId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="hover:text-emerald-200 hover:underline"
                            >
                              {label}
                            </Link>
                          </span>
                        );
                      }
                      return (
                        <span key={r.id}>
                          {separator}
                          {label}
                        </span>
                      );
                    })}
                    {dayData.reservas.length > 2
                      ? ` +${dayData.reservas.length - 2}`
                      : ''}
                  </div>
                )}

                {hasBloqueos && (
                  <div className="line-clamp-1 text-[9px] sm:text-[10px] text-rose-300/90 mt-0.5">
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
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                {selectedDayData.date.toLocaleDateString('ca-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                Detalls del dia i accions ràpides
              </p>
            </div>

            {selectedDayData.key && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/reservas/new?date=${selectedDayData.key}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 active:scale-[0.98]"
                >
                  + Nova reserva
                </Link>
                <Link
                  href={`/admin/bloqueos/new?date=${selectedDayData.key}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 transition-all hover:bg-slate-600/50 hover:border-slate-500/50 active:scale-[0.98]"
                >
                  Bloquejar dia
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Reserves */}
            <div className="flex flex-col">
              <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide text-emerald-400/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Reserves ({selectedDayData.payload?.reservas?.length || 0})
              </h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                {selectedDayData.payload?.reservas?.length ? (
                  selectedDayData.payload.reservas.map((r) => (
                    <Link
                      key={r.id}
                      href={r.leadId ? `/admin/leads/${r.leadId}` : `/admin/bookings/${r.id}`}
                      className="block rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/15"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-emerald-200 text-sm">
                          {r.clienteNombre ?? 'Client sense nom'}
                        </div>
                        {r.estado && (
                          <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                            {r.estado}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-emerald-300/70">
                        {r.ubicacion && (
                          <>
                            {r.ubicacion}
                            {' · '}
                          </>
                        )}
                        {new Date(r.fechaEvento).toLocaleTimeString('ca-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-600/50 px-3 py-4 text-center text-sm text-slate-500">
                    Cap reserva en aquest dia
                  </div>
                )}
              </div>
            </div>

            {/* Bloquejos */}
            <div className="flex flex-col">
              <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide text-rose-400/80">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Bloquejos ({selectedDayData.payload?.bloqueos?.length || 0})
              </h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                {selectedDayData.payload?.bloqueos?.length ? (
                  selectedDayData.payload.bloqueos.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5"
                    >
                      <div className="font-medium text-rose-200 text-sm">
                        Bloqueig
                      </div>
                      <div className="mt-1 text-xs text-rose-300/70">
                        {b.motivo ?? 'Sense motiu especificat'}
                        {b.notas ? ` · ${b.notas}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-600/50 px-3 py-4 text-center text-sm text-slate-500">
                    Dia no bloquejat
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

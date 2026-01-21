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
  const offsetFromMonday = (firstWeekday + 6) % 7; // passar a setmana que comen├ºa dilluns
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
    })} ÔÇô ${lastVisible.toLocaleDateString('ca-ES', {
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
    <div className="space-y-4">
      {/* Barra superior: selector de mes + meta info */}
      <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white/60 p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, -1))}
            className="inline-flex items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100"
          >
            ÔÇ╣ Mes anterior
          </button>
          <button
            type="button"
            onClick={() =>
              setMonthYear({
                year: today.getFullYear(),
                month: today.getMonth(),
              })
            }
            className="inline-flex items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100"
          >
            Avui
          </button>
          <button
            type="button"
            onClick={() => setMonthYear((prev) => addMonths(prev, 1))}
            className="inline-flex items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100"
          >
            Mes seg├╝ent ÔÇ║
          </button>
        </div>

        <div className="flex flex-col items-start gap-1 text-sm md:items-end">
          <div className="text-base font-semibold tracking-tight text-slate-700">
            {monthLabel(monthYear)}
          </div>
          <div className="text-sm text-slate-500">
            Dies visibles: <span className="font-medium">{visibleRangeLabel}</span>
          </div>
          {loading && (
            <div className="text-sm text-slate-500" role="status" aria-live="polite">
              Carregant ocupaci├│...
            </div>
          )}
          {error && (
            <div className="text-sm font-medium text-red-600" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Stats r├ápids del mes visible */}
      <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-4">
        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Reserves
            </span>
            <span className="text-lg font-semibold text-slate-700">
              {stats.totalReservas}
            </span>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {stats.reservaDays + stats.mixedDays} dies ocupats
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Bloquejos
            </span>
            <span className="text-lg font-semibold text-slate-700">
              {stats.totalBloqueos}
            </span>
          </div>
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
            {stats.bloqueadoDays + stats.mixedDays} dies
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Dies lliures
            </span>
            <span className="text-lg font-semibold text-slate-700">
              {stats.freeDays}
            </span>
          </div>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            Sense events
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Dies mixtes
            </span>
            <span className="text-lg font-semibold text-slate-700">
              {stats.mixedDays}
            </span>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            Reserva + bloqueig
          </span>
        </div>
      </div>

      {/* Llegenda */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
        <span className="font-semibold text-slate-700">Llegenda:</span>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-stone-200 bg-white" />
          <span>Lliure</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-100" />
          <span>Amb reserves</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-rose-300 bg-rose-100" />
          <span>Bloquejat</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-amber-300 bg-amber-100" />
          <span>Reserves + bloqueig</span>
        </div>
      </div>

      {/* Cap├ºalera de dies */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Graella del calendari */}
      <div className="grid grid-cols-7 gap-px rounded-xl border border-stone-200 bg-stone-100 shadow-sm">
        {cells.map((cell) => {
          const dayData =
            data?.days?.[cell.key] ??
            ({ reservas: [], bloqueos: [] } as CalendarApiDay);

          const hasReservas = dayData.reservas.length > 0;
          const hasBloqueos = dayData.bloqueos.length > 0;

          let bgClass = 'bg-white border border-transparent';
          if (hasReservas && !hasBloqueos) {
            bgClass = 'bg-emerald-50 border border-emerald-100';
          } else if (!hasReservas && hasBloqueos) {
            bgClass = 'bg-rose-50 border border-rose-100';
          } else if (hasReservas && hasBloqueos) {
            bgClass = 'bg-amber-50 border border-amber-100';
          }

          const isSelected = selectedDateKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelectedDateKey(cell.key)}
              className={[
                'flex min-h-[96px] flex-col items-stretch justify-between p-2 text-left text-sm transition',
                bgClass,
                !cell.inCurrentMonth ? 'opacity-40' : '',
                isSelected
                  ? 'ring-2 ring-stone-300 ring-offset-1 ring-offset-stone-100'
                  : '',
                'hover:bg-stone-100',
              ].join(' ')}
            >
              <div className="flex items-start justify-between">
                <span
                  className={[
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                    isToday(cell.date)
                      ? 'bg-white text-slate-700'
                      : 'text-slate-700',
                  ].join(' ')}
                >
                  {cell.date.getDate()}
                </span>
                {hasReservas && (
                  <div className="line-clamp-2 text-xs font-medium text-slate-700">
                    {dayData.reservas.slice(0, 2).map((r, index) => {
                      const label = r.clienteNombre || 'Client';
                      const separator = index > 0 ? ' - ' : '';
                      if (r.leadId) {
                        return (
                          <span key={r.id}>
                            {separator}
                            <Link
                              href={`/admin/leads/${r.leadId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="hover:text-amber-600"
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
                  <div className="line-clamp-1 text-xs text-rose-800">
                    {dayData.bloqueos[0].motivo || 'Bloquejat'}
                    {dayData.bloqueos.length > 1
                      ? ` (+${dayData.bloqueos.length - 1})`
                      : ''}
                  </div>
                )}
                {!hasReservas && !hasBloqueos && (
                  <div className="text-xs text-slate-400">
                    Sense events
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Panell de detalls (sticky a la part baixa de la vista) */}
      {selectedDayData.date && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-700">
                Detall del dia{' '}
                {selectedDayData.date.toLocaleDateString('ca-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Resum d&apos;ocupaci├│ i accions r├ápides.
              </p>
            </div>

            {selectedDayData.key && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/reservas/new?date=${selectedDayData.key}`}
                  className="inline-flex items-center rounded-md border border-emerald-600 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  Nova reserva
                </Link>
                <Link
                  href={`/admin/bloqueos/new?date=${selectedDayData.key}`}
                  className="inline-flex items-center rounded-md border border-rose-600 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                >
                  Bloquejar dia
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Reserves */}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Reserves
              </h3>
              <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1 text-sm">
                {selectedDayData.payload?.reservas?.length ? (
                  selectedDayData.payload.reservas.map((r) => (
                    <Link
                      key={r.id}
                      href={r.leadId ? `/admin/leads/${r.leadId}` : `/admin/bookings/${r.id}`}
                      className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-2 transition hover:border-emerald-200 hover:bg-emerald-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-slate-700">
                          {r.clienteNombre ?? 'Client sense nom'}
                        </div>
                        {r.estado && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                            {r.estado}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {r.ubicacion && (
                          <>
                            {r.ubicacion}
                            {' ┬À '}
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
                  <div className="rounded-md border border-dashed border-stone-200 px-2 py-2 text-sm text-slate-500">
                    Cap reserva en aquest dia.
                  </div>
                )}
              </div>
            </div>

            {/* Bloquejos */}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Dies bloquejats
              </h3>
              <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1 text-sm">
                {selectedDayData.payload?.bloqueos?.length ? (
                  selectedDayData.payload.bloqueos.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-md border border-rose-100 bg-rose-50 px-2 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-slate-700">
                          Bloqueig
                        </div>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {b.motivo ?? 'Sense motiu especificat'}
                        {b.notas ? ` ┬À ${b.notas}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-stone-200 px-2 py-2 text-sm text-slate-500">
                    Dia no bloquejat.
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

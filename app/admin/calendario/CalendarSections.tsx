'use client';

import Link from 'next/link';
import { formatDateShort } from '@/lib/constants';
import { ADMIN_CALENDAR_HELP, helpAttrs } from '../components/adminHelpContent';

interface CalendarHeaderProps {
  monthLabel: string;
  visibleRangeLabel: string;
  loading: boolean;
  error: string | null;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  goToView: (view: 'week' | 'day') => void;
}

export function CalendarHeader({
  monthLabel,
  visibleRangeLabel,
  loading,
  error,
  onPrev,
  onToday,
  onNext,
  goToView,
}: CalendarHeaderProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border admin-card-glass p-2.5 sm:p-3 md:flex-row md:items-center md:justify-between"
      {...helpAttrs(ADMIN_CALENDAR_HELP.monthNavigation)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onPrev} className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium">
          ← Anterior
        </button>
        <button type="button" onClick={onToday} className="ap-btn text-xs admin-tone-soft-warning">
          Avui
        </button>
        <button type="button" onClick={onNext} className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium">
          Mes següent →
        </button>
        <div className="flex rounded-lg border overflow-hidden ml-2">
          <span className="inline-flex items-center border-r px-2.5 py-1.5 text-xs font-semibold admin-tone-soft-warning">
            Mes
          </span>
          <button type="button" onClick={() => goToView('week')} className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium border-r">
            Setmana
          </button>
          <button type="button" onClick={() => goToView('day')} className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium">
            Dia
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1 text-sm md:items-end">
        <div className="text-base sm:text-lg font-semibold tracking-tight">{monthLabel}</div>
        <div className="text-sm">Dies visibles: <span className="font-medium">{visibleRangeLabel}</span></div>
        {loading && (
          <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Carregant ocupació...
          </div>
        )}
        {error && (
          <div className="text-sm font-medium" role="alert">{error}</div>
        )}
      </div>
    </div>
  );
}

export function CalendarStatsGrid({
  stats,
}: {
  stats: {
    totalReservas: number;
    totalBloqueos: number;
    freeDays: number;
    mixedDays: number;
    reservaDays: number;
    bloqueadoDays: number;
  };
}) {
  const entries = [
    { label: 'Reserves', value: stats.totalReservas, badge: `${stats.reservaDays + stats.mixedDays} dies`, tone: 'success' },
    { label: 'Bloquejos', value: stats.totalBloqueos, badge: `${stats.bloqueadoDays + stats.mixedDays} dies`, tone: 'danger' },
    { label: 'Dies lliures', value: stats.freeDays, badge: 'Disponibles', tone: 'info' },
    { label: 'Dies mixtes', value: stats.mixedDays, badge: 'Reserva + bloqueig', tone: 'warning' },
  ];

  const toneClasses: Record<string, string> = {
    success: 'admin-tone-soft-success admin-tone-border-success',
    danger: 'admin-tone-soft-danger admin-tone-border-danger',
    info: 'admin-tone-soft-info admin-tone-border-info',
    warning: 'admin-tone-soft-warning admin-tone-border-warning',
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4" {...helpAttrs(ADMIN_CALENDAR_HELP.stats)}>
      {entries.map((entry) => (
        <div key={entry.label} className={`admin-card-glass rounded-xl border p-2.5 sm:p-3 transition-all ${toneClasses[entry.tone]}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide">{entry.label}</span>
              <span className="text-xl sm:text-2xl font-bold">{entry.value}</span>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium">{entry.badge}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarLegend() {
  const colors = [
    { label: 'Lliure', classes: 'bg-white/15 border' },
    { label: 'Reserves', classes: 'admin-tone-soft-success admin-tone-border-success' },
    { label: 'Bloquejat', classes: 'admin-tone-soft-danger admin-tone-border-danger' },
    { label: 'Mixt', classes: 'admin-tone-soft-warning admin-tone-border-warning' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl admin-card-glass border px-3 sm:px-4 py-2 text-sm" {...helpAttrs(ADMIN_CALENDAR_HELP.legend)}>
      <span className="font-medium">Llegenda:</span>
      {colors.map((color) => (
        <div key={color.label} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-sm ${color.classes}`} />
          <span className="text-xs sm:text-sm">{color.label}</span>
        </div>
      ))}
    </div>
  );
}

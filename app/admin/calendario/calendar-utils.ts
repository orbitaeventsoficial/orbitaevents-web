/**
 * Tipus, constants i helpers purs compartits pels 3 components de calendari
 * (Month, Week, Day). Font única de veritat per evitar duplicats.
 */

import { EVENT_TYPE_PLAIN, DEFAULT_LOCALE } from '@/lib/constants';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CalendarApiDay = {
  reservas: {
    id: string;
    leadId?: string | null;
    customerId?: string | null;
    fechaEvento: string;
    clientName?: string | null;
    ubicacion?: string | null;
    estado?: string | null;
    eventType?: string | null;
    eventStartTime?: string | null;
    eventEndTime?: string | null;
    packName?: string | null;
  }[];
  bloqueos: {
    id: string;
    fecha: string;
    motivo?: string | null;
    notas?: string | null;
  }[];
};

export type CalendarApiResponse = {
  days: Record<string, CalendarApiDay>; // key: 'YYYY-MM-DD'
};

export type MonthYear = {
  year: number;
  month: number; // 0-11
};

export type CalendarCell = {
  date: Date;
  key: string; // YYYY-MM-DD
  inCurrentMonth: boolean;
};

// ─── Constants ──────────────────────────────────────────────────────────────

export const weekdayLabels = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']; // dilluns primer

export const weekdayLabelsFull = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

export const CALENDAR_EVENT_LABELS: Record<string, string> = {
  ...EVENT_TYPE_PLAIN,
  CELEBRATION: 'Celebració',
};

export const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pendent', cls: 'bg-amber-500/20 text-amber-300' },
  CONFIRMED: { label: 'Confirmat', cls: 'admin-tone-soft-success' },
  PREPARING: { label: 'Preparant', cls: 'bg-blue-500/20 text-blue-300' },
  COMPLETED: { label: 'Completat', cls: 'bg-white/10 text-white/50' },
  CANCELLED: { label: 'Cancel·lat', cls: 'admin-tone-soft-danger' },
};

export const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 – 23:00

// ─── Helpers ────────────────────────────────────────────────────────────────

export function resolveServiceLabel(booking: CalendarApiDay['reservas'][number]): string {
  const pack = booking.packName?.trim();
  if (pack) return pack;
  const eventType = booking.eventType?.trim();
  if (eventType && CALENDAR_EVENT_LABELS[eventType]) return CALENDAR_EVENT_LABELS[eventType];
  if (eventType) return eventType;
  return 'Servei';
}

export function resolveTimeLabel(booking: CalendarApiDay['reservas'][number]): string {
  const start = booking.eventStartTime?.trim();
  const end = booking.eventEndTime?.trim();
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return new Date(booking.fechaEvento).toLocaleTimeString(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthDays({ year, month }: MonthYear): CalendarCell[] {
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

export function addMonths(base: MonthYear, delta: number): MonthYear {
  const m = base.month + delta;
  const year = base.year + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  return { year, month };
}

export function monthLabel({ year, month }: MonthYear): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function getWeekDays(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - mondayOffset);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function parseHour(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const m = timeStr.match(/^(\d{1,2})/);
  return m ? parseInt(m[1], 10) : null;
}

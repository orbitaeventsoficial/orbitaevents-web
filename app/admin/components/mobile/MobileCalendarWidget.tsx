'use client';
import { log } from '@/lib/logger';

/**
 * MobileCalendarWidget.tsx
 * 
 * Widget de calendario compacto para móvil
 * - Vista mensual compacta
 * - Indicadores de eventos
 * - Navegación por gestos
 * - Detalle del día seleccionado
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface CalendarEvent {
  id: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  status: string;
  total: number;
  clientName?: string;
}

interface DayEvents {
  date: string;
  events: CalendarEvent[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const DAYS_SHORT = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const MONTHS = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
];

const EVENT_COLORS: Record<string, string> = {
  WEDDING: 'bg-pink-500',
  BIRTHDAY: 'bg-purple-500',
  CORPORATE: 'bg-blue-500',
  COMMUNION: 'bg-cyan-500',
  BAPTISM: 'bg-teal-500',
  PRIVATE_PARTY: 'bg-orange-500',
  OTHER: 'bg-gray-500',
};

const EVENT_ICONS: Record<string, string> = {
  WEDDING: '💒',
  BIRTHDAY: '🎂',
  CORPORATE: '🏢',
  COMMUNION: '⛪',
  BAPTISM: '👶',
  PRIVATE_PARTY: '🎉',
  OTHER: '🎭',
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Añadir días del mes anterior para completar la primera semana
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Lunes = 0
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Días del mes actual
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Añadir días del siguiente mes para completar última semana
  const remainingDays = 42 - days.length; // 6 semanas * 7 días
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

// Cabecera del calendario
function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  onToday,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-slate-600 active:bg-stone-200"
      >
        {Icons.chevronLeft}
      </button>

      <div className="text-center">
        <motion.h2
          key={`${year}-${month}`}
          className="text-lg font-bold text-slate-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {MONTHS[month]} {year}
        </motion.h2>
        {!isCurrentMonth && (
          <button
            onClick={onToday}
            className="text-xs text-orange-400 mt-1"
          >
            Anar a avui
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-slate-600 active:bg-stone-200"
      >
        {Icons.chevronRight}
      </button>
    </div>
  );
}

// Día del calendario
function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  events,
  onClick,
}: {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onClick: () => void;
}) {
  const hasEvents = events.length > 0;
  const uniqueTypes = [...new Set(events.map((e) => e.eventType))];

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${
        isSelected
          ? 'bg-orange-500 text-white'
          : isToday
          ? 'bg-stone-200 text-slate-800'
          : isCurrentMonth
          ? 'text-slate-700 active:bg-stone-100'
          : 'text-slate-300'
      }`}
    >
      <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>
        {date.getDate()}
      </span>

      {/* Event indicators */}
      {hasEvents && !isSelected && (
        <div className="flex gap-0.5 mt-0.5">
          {uniqueTypes.slice(0, 3).map((type, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${EVENT_COLORS[type] || 'bg-gray-500'}`}
            />
          ))}
        </div>
      )}

      {/* Today indicator */}
      {isToday && !isSelected && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
      )}
    </button>
  );
}

// Eventos del día seleccionado
function DayEventsPanel({
  date,
  events,
  onClose,
}: {
  date: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
}) {
  if (!date) return null;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {date && (
        <motion.div
          className="mt-4 p-4 bg-stone-100 rounded-2xl border border-stone-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-800 font-semibold">
              {date.toLocaleDateString('ca-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {events.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">
              Cap event aquest dia
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/bookings/${event.id}`}
                  className="flex items-center gap-3 p-3 bg-stone-100 rounded-xl active:bg-stone-200 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${EVENT_COLORS[event.eventType]}/20 flex items-center justify-center text-lg`}>
                    {EVENT_ICONS[event.eventType] || '📅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium truncate">{event.eventName}</p>
                    <p className="text-slate-400 text-sm">{event.clientName || 'Sense client'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold text-sm">{event.total}€</p>
                    <p className="text-slate-400 text-xs">{formatTime(event.eventDate)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Add event button */}
          <Link
            href={`/admin/bookings/new?date=${formatDateKey(date)}`}
            className="flex items-center justify-center gap-2 mt-3 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 font-medium text-sm active:bg-orange-500/20"
          >
            + Afegir event
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileCalendarWidget({ fullPage = false }: { fullPage?: boolean }) {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events for current month
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/calendario/mes?year=${currentYear}&month=${currentMonth + 1}`
      );
      if (!response.ok) throw new Error('Error fetching events');

      const data = await response.json();
      
      // Agrupar eventos por fecha
      const grouped: Record<string, CalendarEvent[]> = {};
      if (data.ok && data.bookings) {
        data.bookings.forEach((booking: CalendarEvent) => {
          const dateKey = booking.eventDate.split('T')[0];
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(booking);
        });
      }
      
      setEvents(grouped);
    } catch (err) {
      log.error('Error fetching calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const goToPrevMonth = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  }, [today]);

  // Handle swipe
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) {
      goToPrevMonth();
    } else if (info.offset.x < -50) {
      goToNextMonth();
    }
  }, [goToPrevMonth, goToNextMonth]);

  // Get days for current month
  const days = useMemo(() => 
    getDaysInMonth(currentYear, currentMonth)
  , [currentYear, currentMonth]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = formatDateKey(selectedDate);
    return events[key] || [];
  }, [selectedDate, events]);

  const containerClass = fullPage 
    ? 'min-h-screen bg-stone-100 p-4 pt-6 pb-24 lg:hidden'
    : 'p-4 bg-stone-1000 rounded-2xl border border-stone-200';

  return (
    <div className={containerClass}>
      {fullPage && (
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Calendari</h1>
      )}

      <CalendarHeader
        year={currentYear}
        month={currentMonth}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
      />

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_SHORT.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-slate-400 font-medium py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <motion.div
        className="grid grid-cols-7 gap-1"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {days.map((date, i) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const dateKey = formatDateKey(date);
          const dayEvents = events[dateKey] || [];

          return (
            <CalendarDay
              key={i}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isToday={isSameDay(date, today)}
              isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
              events={dayEvents}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(5);
                setSelectedDate(isSameDay(date, selectedDate || new Date(0)) ? null : date);
              }}
            />
          );
        })}
      </motion.div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-stone-200/70 flex items-center justify-center rounded-2xl">
          <motion.div
            className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}

      {/* Selected day events */}
      <DayEventsPanel
        date={selectedDate}
        events={selectedDateEvents}
        onClose={() => setSelectedDate(null)}
      />

      {/* Month summary */}
      {!selectedDate && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-slate-400">Casaments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-slate-400">Festes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-400">Empreses</span>
          </div>
        </div>
      )}
    </div>
  );
}

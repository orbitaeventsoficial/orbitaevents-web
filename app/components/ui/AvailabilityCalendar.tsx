// app/components/ui/AvailabilityCalendar.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CalendarDay {
  fecha: string;
  disponible: boolean;
  reservas: number;
}

export default function AvailabilityCalendar() {
  const t = useTranslations('calendar');
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2025, 0, 1)); // SSR-safe default

  // Set actual date on client to avoid hydration mismatch
  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [, setLoading] = useState(true);
  const DIAS_SEMANA = t.raw('days') as string[];

  const fetchAvailability = async (date: Date) => {
    setLoading(true);
    try {
      const mes = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch('/api/calendario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes }),
      });

      if (res.ok) {
        const data = await res.json();
        setDays(data.dias || []);
      }
    } catch (e) {
      console.error('Error fetching calendar:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability(currentMonth);
  }, [currentMonth]);

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const MESES = t.raw('months') as string[];
  const monthName = `${MESES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  // Generar grid del calendario
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label={t('prevMonth')}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <h3 className="text-xl font-bold text-white capitalize flex items-center gap-2">
          <Calendar className="w-5 h-5 text-oe-gold" />
          {monthName}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label={t('nextMonth')}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_SEMANA.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-white/50 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding days */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {/* Actual days */}
        {Array.from({ length: lastDay.getDate() }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const dayData = days.find((d) => d.fecha === dateStr);
          const disponible = dayData?.disponible ?? true;
          const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
          const isSaturday = new Date(dateStr).getDay() === 6;

          return (
            <div
              key={dayNum}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                transition-all duration-200
                ${isPast ? 'text-white/20 cursor-not-allowed' : ''}
                ${!isPast && disponible && isSaturday ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                ${!isPast && !disponible ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                ${!isPast && disponible && !isSaturday ? 'text-white/70 hover:bg-white/10' : ''}
              `}
              title={isPast ? t('pastDate') : !disponible ? t('notAvailable') : isSaturday ? `✓ ${t('available')}` : ''}
            >
              {dayNum}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
          <span className="text-white/60">{t('available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
          <span className="text-white/60">{t('occupied')}</span>
        </div>
      </div>
    </div>
  );
}

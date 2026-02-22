/**
 * Availability Calendar Component
 * Displays available/booked/blocked dates in a calendar view
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { log } from '@/lib/logger';

interface AvailabilityDate {
  date: string; // YYYY-MM-DD
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  note?: string;
}

interface AvailabilityCalendarProps {
  /**
   * Initial month to display (YYYY-MM format)
   * Defaults to current month
   */
  initialMonth?: string;

  /**
   * Locale for month/day names
   */
  locale?: string;

  /**
   * Show legend
   */
  showLegend?: boolean;

  /**
   * Compact mode (smaller cells)
   */
  compact?: boolean;
}

export function AvailabilityCalendar({
  initialMonth,
  locale = 'es',
  showLegend = true,
  compact = false,
}: AvailabilityCalendarProps) {
  const t = useTranslations('calendar');

  // Current displayed month
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialMonth) {
      return new Date(initialMonth + '-01');
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Availability data
  const [availability, setAvailability] = useState<Map<string, AvailabilityDate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability for current month
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get first and last day of month
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const from = firstDay.toISOString().split('T')[0];
        const to = lastDay.toISOString().split('T')[0];

        const response = await fetch(`/api/availability?from=${from}&to=${to}`);
        const data = await response.json();

        if (data.success && data.data?.dates) {
          const map = new Map<string, AvailabilityDate>();
          data.data.dates.forEach((item: AvailabilityDate) => {
            map.set(item.date, item);
          });
          setAvailability(map);
        } else {
          setError(data.error || 'Failed to load availability');
        }
      } catch (err) {
        log.error('Error fetching availability', err);
        setError('Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [currentMonth]);

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Array<{
      date: Date;
      dateString: string;
      isCurrentMonth: boolean;
      availability?: AvailabilityDate;
    }> = [];

    // Add padding days from previous month
    const firstDayOfWeek = firstDay.getDay();
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

    for (let i = paddingDays; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        availability: availability.get(dateString),
      });
    }

    // Add current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        date,
        dateString,
        isCurrentMonth: true,
        availability: availability.get(dateString),
      });
    }

    // Add padding days from next month
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        const dateString = date.toISOString().split('T')[0];
        days.push({
          date,
          dateString,
          isCurrentMonth: false,
          availability: availability.get(dateString),
        });
      }
    }

    return days;
  };

  // Get status color
  const getStatusColor = (status?: 'AVAILABLE' | 'BOOKED' | 'BLOCKED') => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500/20 border-green-500 text-green-200';
      case 'BOOKED':
        return 'bg-red-500/20 border-red-500 text-red-200';
      case 'BLOCKED':
        return 'bg-gray-500/20 border-gray-500 text-gray-200';
      default:
        return 'bg-white/5 border-white/10 text-white/50';
    }
  };

  const days = getDaysInMonth();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2021, 0, 4 + i);
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date);
  });

  const monthName = currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label={t('previousMonth')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold capitalize">{monthName}</h2>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label={t('nextMonth')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading/Error */}
      {loading && (
        <div className="text-center py-8 text-white/60">
          <div className="animate-pulse">{t('loading')}</div>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-400">
          {t('error')}: {error}
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && !error && (
        <>
          {/* Week day headers */}
          <div className={`grid grid-cols-7 gap-2 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {weekDays.map((day) => (
              <div key={day} className="text-center font-medium text-white/60">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className={`grid grid-cols-7 gap-2 ${compact ? 'gap-1' : 'gap-2'}`}>
            {days.map((day, index) => {
              const isToday =
                day.dateString === new Date().toISOString().split('T')[0];
              const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <div
                  key={index}
                  className={`
                    ${compact ? 'h-10' : 'h-14'}
                    border rounded-lg flex items-center justify-center
                    ${day.isCurrentMonth ? 'opacity-100' : 'opacity-30'}
                    ${isToday ? 'ring-2 ring-purple-500' : ''}
                    ${isPast ? 'opacity-40' : ''}
                    ${getStatusColor(day.availability?.status)}
                    ${day.availability?.note ? 'cursor-help' : ''}
                    transition-all hover:scale-105
                  `}
                  title={day.availability?.note}
                >
                  <span className={compact ? 'text-xs' : 'text-sm'}>
                    {day.date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Legend */}
      {showLegend && !loading && !error && (
        <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-green-500/20 border-green-500"></div>
            <span>{t('legend.available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-red-500/20 border-red-500"></div>
            <span>{t('legend.booked')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-gray-500/20 border-gray-500"></div>
            <span>{t('legend.blocked')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-white/5 border-white/10"></div>
            <span>{t('legend.noData')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

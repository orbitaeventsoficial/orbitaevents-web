'use client';

import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import type { BookingConflictRow, BookingDateConflict } from './booking-form.types';

export function useBookingDateConflicts(eventDate: string) {
  const [dateConflicts, setDateConflicts] = useState<BookingDateConflict[]>([]);
  const [dateConflictError, setDateConflictError] = useState('');

  useEffect(() => {
    if (!eventDate) {
      setDateConflicts([]);
      setDateConflictError('');
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetchWithCsrf(`/api/admin/bookings?fromDate=${eventDate}&toDate=${eventDate}&limit=10`, {
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { bookings?: BookingConflictRow[]; error?: string; message?: string };
        if (!res.ok) {
          throw new Error(data.error || data.message || 'No s\'ha pogut verificar la disponibilitat del dia.');
        }
        const active = ((data.bookings || []) as BookingConflictRow[]).filter((booking) =>
          ['PENDING', 'CONFIRMED', 'PREPARING'].includes(booking.status)
        );
        setDateConflicts(
          active.map((booking) => ({
            id: booking.id,
            reference: booking.reference,
            clientName: booking.clientName,
            eventStartTime: booking.eventStartTime || null,
          }))
        );
        setDateConflictError('');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('[useBookingDateConflicts] Error carregant conflictes de data', { eventDate, error });
        setDateConflictError(
          error instanceof Error ? error.message : 'No s\'ha pogut verificar la disponibilitat del dia.'
        );
      }
    })();

    return () => controller.abort();
  }, [eventDate]);

  return { dateConflicts, dateConflictError };
}

'use client';

import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import type { BookingConflictRow, BookingDateConflict } from './booking-form.types';

export function useBookingDateConflicts(eventDate: string) {
  const [dateConflicts, setDateConflicts] = useState<BookingDateConflict[]>([]);

  useEffect(() => {
    if (!eventDate) {
      setDateConflicts([]);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetchWithCsrf(`/api/admin/bookings?fromDate=${eventDate}&toDate=${eventDate}&limit=10`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
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
      } catch {
        // ignore abort
      }
    })();

    return () => controller.abort();
  }, [eventDate]);

  return dateConflicts;
}

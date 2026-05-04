import { useEffect, useState } from 'react';
import { fetchPublicAvailability } from '@/lib/api/publicAvailabilityClient';

export function useBookedDates(locale: string) {
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPublicAvailability(locale)
      .then((response) => {
        if (!response.ok || !response.data?.monthlyAvailability) return;
        const dates = new Set<string>();
        for (const month of response.data.monthlyAvailability) {
          for (const saturday of month.saturdayDates || []) {
            if (saturday.status === 'booked' || saturday.status === 'blocked') {
              dates.add(saturday.date);
            }
          }
        }
        setBookedDates(dates);
      })
      .catch(() => {
        // Keep empty set on network errors.
      });
  }, [locale]);

  return bookedDates;
}

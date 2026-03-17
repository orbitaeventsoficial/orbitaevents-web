import { useEffect, useState } from 'react';

export function useBookedDates(locale: string) {
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/public/availability?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.ok || !data.data?.monthlyAvailability) return;
        const dates = new Set<string>();
        for (const month of data.data.monthlyAvailability) {
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

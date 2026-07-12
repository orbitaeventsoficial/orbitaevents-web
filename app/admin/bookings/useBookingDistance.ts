'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

interface UseBookingDistanceOptions {
  eventVenue: string;
  eventLocation: string;
  onDistanceResolved: (distanceKm: string) => void;
  /** Peatges automàtics (#1373): Google els dona amb la ruta quan n'hi ha. */
  onTollsResolved?: (tollsEur: string) => void;
  enabled?: boolean;
}

export function useBookingDistance({ eventVenue, eventLocation, onDistanceResolved, onTollsResolved, enabled = true }: UseBookingDistanceOptions) {
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);
  const lastDistanceDestinationRef = useRef('');

  const calculateDistanceForDestination = useCallback(async (destination: string) => {
    setCalculatingDistance(true);
    setDistanceMessage(null);

    try {
      const res = await fetchWithCsrf('/api/admin/maps/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut calcular la distància');
      }

      onDistanceResolved(String(data.roundTripKm || 0));
      if (onTollsResolved && typeof data.tollsEur === 'number' && data.tollsEur > 0) {
        onTollsResolved(String(data.tollsEur));
      }
      lastDistanceDestinationRef.current = destination;
      const tollNote = typeof data.tollsEur === 'number' && data.tollsEur > 0 ? ` · peatges ${data.tollsEur} €` : '';
      setDistanceMessage(
        `Ruta calculada: ${data.originResolved || 'Origen'} → ${data.destinationResolved || 'Destí'} (${data.oneWayKm || 0} km anada, ${data.roundTripKm || 0} km anada+tornada${tollNote}).`
      );
    } catch (error) {
      setDistanceMessage(error instanceof Error ? error.message : 'Error calculant distància');
    } finally {
      setCalculatingDistance(false);
    }
  }, [onDistanceResolved]);

  useEffect(() => {
    if (!enabled) return;
    const destination = [eventVenue.trim(), eventLocation.trim()].filter(Boolean).join(', ');
    if (destination.length < 3) return;
    if (destination === lastDistanceDestinationRef.current) return;

    const timer = setTimeout(() => {
      void calculateDistanceForDestination(destination);
    }, 550);

    return () => clearTimeout(timer);
  }, [calculateDistanceForDestination, enabled, eventLocation, eventVenue]);

  return {
    calculatingDistance,
    distanceMessage,
  };
}

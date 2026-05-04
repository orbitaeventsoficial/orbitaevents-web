'use client';

import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { buildGoogleMapsSearchUrl } from '@/lib/google-maps-url';

export type CustomerLocationDistanceProps = {
  location: string;
  venue?: string;
  className?: string;
};

type DistanceState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; oneWayKm: number; roundTripKm: number }
  | { kind: 'error' };

const ZERO_WIDTH = '​';

/**
 * Mostra la ubicació d'un event amb un link a Google Maps i la distància
 * real (km · anada) calculada via `/api/admin/maps/distance`. Pensat per
 * ser un client island incrustat dins de panells servidors com `SummaryPanel`.
 *
 * Refinement de B.6 — F.24 del §6.18 mancances transversals.
 */
export default function CustomerLocationDistance({
  location,
  venue,
  className,
}: CustomerLocationDistanceProps) {
  const [state, setState] = useState<DistanceState>({ kind: 'idle' });

  const destination = [venue?.trim(), location.trim()].filter(Boolean).join(', ');
  const mapsHref = buildGoogleMapsSearchUrl(destination);

  useEffect(() => {
    if (!destination || destination.length < 3) {
      setState({ kind: 'idle' });
      return;
    }

    let cancelled = false;
    setState({ kind: 'loading' });

    void (async () => {
      try {
        const res = await fetchWithCsrf('/api/admin/maps/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          oneWayKm?: number;
          roundTripKm?: number;
        };
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setState({ kind: 'error' });
          return;
        }
        setState({
          kind: 'ok',
          oneWayKm: Number(data.oneWayKm) || 0,
          roundTripKm: Number(data.roundTripKm) || 0,
        });
      } catch {
        if (!cancelled) setState({ kind: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destination]);

  if (!location.trim()) return null;

  const distanceLabel =
    state.kind === 'loading'
      ? `${ZERO_WIDTH}calculant…`
      : state.kind === 'ok' && state.oneWayKm > 0
        ? `${state.oneWayKm.toFixed(1)} km · anada+tornada ${state.roundTripKm.toFixed(0)} km`
        : null;

  return (
    <span data-testid="customer-location-distance" className={className}>
      <span aria-hidden>📍</span>{' '}
      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:opacity-90"
        >
          {location}
        </a>
      ) : (
        <span>{location}</span>
      )}
      {distanceLabel ? <span className="ml-1 opacity-60"> · {distanceLabel}</span> : null}
      {state.kind === 'error' ? (
        <span className="ml-1 opacity-50"> · ruta no calculada</span>
      ) : null}
    </span>
  );
}

import { env } from '@/lib/env';
import { log } from '@/lib/logger';

const DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const DEFAULT_BASE_ADDRESS = 'Granollers, Barcelona';

type DistanceCalculation = {
  origin: string;
  destination: string;
  originResolved: string;
  destinationResolved: string;
  oneWayKm: number;
  roundTripKm: number;
  durationText: string | null;
  /** Peatges de la ruta anada+tornada en €, o null si Google no en dona (#1373). */
  tollsEur: number | null;
};

function getOrbitaBaseAddress(): string {
  return (env.ORBITA_BASE_ADDRESS || DEFAULT_BASE_ADDRESS).trim();
}

/**
 * Peatges d'una ruta (un sentit) via la Routes API v2 de Google (#1373). Retorna
 * l'import en € o null si Google no en dona (ruta sense dades de peatge, país no
 * cobert, o API no activada). BEST-EFFORT: mai llança — si falla, retorna null i el
 * flux continua amb peatges manuals. La Distance Matrix (distància) NO dona peatges.
 */
async function fetchOneWayTollsEur(origin: string, destination: string, apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(ROUTES_API_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.travelAdvisory.tollInfo',
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: 'DRIVE',
        extraComputations: ['TOLLS'],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as {
      routes?: Array<{ travelAdvisory?: { tollInfo?: { estimatedPrice?: Array<{ currencyCode?: string; units?: string; nanos?: number }> } } }>;
    };
    const prices = data.routes?.[0]?.travelAdvisory?.tollInfo?.estimatedPrice;
    if (!Array.isArray(prices) || prices.length === 0) return null;
    // Suma tots els trams de peatge (normalment un). Prioritza EUR si n'hi ha.
    const eur = prices.filter((p) => (p.currencyCode ?? 'EUR') === 'EUR');
    const chosen = eur.length > 0 ? eur : prices;
    const total = chosen.reduce((sum, p) => sum + (Number(p.units || 0) + (p.nanos || 0) / 1e9), 0);
    return total > 0 ? Math.round(total * 100) / 100 : null;
  } catch (err) {
    log.error('[googleMaps] Routes API tolls failed:', err as Error);
    return null;
  }
}

export async function calculateGoogleMapsDistance(input: {
  destination: string;
  origin?: string;
}): Promise<DistanceCalculation> {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY_NOT_CONFIGURED');
  }

  const origin = (input.origin || getOrbitaBaseAddress()).trim();
  const destination = (input.destination || '').trim();

  if (!destination) {
    throw new Error('DESTINATION_REQUIRED');
  }

  const url = new URL(DISTANCE_MATRIX_URL);
  url.searchParams.set('origins', origin);
  url.searchParams.set('destinations', destination);
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('language', 'ca');
  url.searchParams.set('units', 'metric');
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`GOOGLE_MAPS_HTTP_${res.status}`);
  }

  const data = await res.json() as {
    status?: string;
    origin_addresses?: string[];
    destination_addresses?: string[];
    rows?: Array<{ elements?: Array<{ status?: string; distance?: { value?: number }; duration?: { text?: string } }> }>;
  };

  if (data.status !== 'OK') {
    throw new Error(`GOOGLE_MAPS_STATUS_${data.status || 'UNKNOWN'}`);
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK' || typeof element.distance?.value !== 'number') {
    throw new Error(`GOOGLE_MAPS_ELEMENT_${element?.status || 'UNKNOWN'}`);
  }

  const oneWayKm = Number((element.distance.value / 1000).toFixed(1));
  const roundTripKm = Number((oneWayKm * 2).toFixed(1));

  // Peatges automàtics (#1373): best-effort via Routes API. El peatge d'un sentit ×2
  // (anada i tornada). Si Google no en dona, `null` → el propietari els posa a mà.
  const oneWayTolls = await fetchOneWayTollsEur(origin, destination, apiKey);
  const tollsEur = oneWayTolls != null ? Math.round(oneWayTolls * 2 * 100) / 100 : null;

  return {
    origin,
    destination,
    originResolved: data.origin_addresses?.[0] || origin,
    destinationResolved: data.destination_addresses?.[0] || destination,
    oneWayKm,
    roundTripKm,
    durationText: element.duration?.text || null,
    tollsEur,
  };
}


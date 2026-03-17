import { env } from '@/lib/env';

const DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const DEFAULT_BASE_ADDRESS = 'Granollers, Barcelona';

type DistanceCalculation = {
  origin: string;
  destination: string;
  originResolved: string;
  destinationResolved: string;
  oneWayKm: number;
  roundTripKm: number;
  durationText: string | null;
};

function getOrbitaBaseAddress(): string {
  return (env.ORBITA_BASE_ADDRESS || DEFAULT_BASE_ADDRESS).trim();
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

  return {
    origin,
    destination,
    originResolved: data.origin_addresses?.[0] || origin,
    destinationResolved: data.destination_addresses?.[0] || destination,
    oneWayKm,
    roundTripKm,
    durationText: element.duration?.text || null,
  };
}


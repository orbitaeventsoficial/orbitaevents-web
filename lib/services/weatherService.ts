/**
 * weatherService.ts — Previsió meteorològica per a pròxims events
 *
 * Consulta OpenWeatherMap (free tier, 5-day forecast) per a reserves
 * amb status CONFIRMED o PREPARING en els pròxims 3 dies.
 * Si no hi ha API key configurada, retorna array buit (graceful fallback).
 * Cache en memòria d'1 hora per evitar crides excessives.
 */

import { prisma } from '@/lib/prisma';
import { WEATHER_DESCRIPTIONS_CA } from '@/lib/constants';
import { log } from '@/lib/logger';

// ─── Tipus ──────────────────────────────────────────────────────────

export interface WeatherForecast {
  bookingId: string;
  clientName: string;
  eventDate: string; // ISO string
  location: string;
  temp: number; // °C
  icon: string; // codi OpenWeatherMap (ex: "01d")
  description: string; // descripció en català
  rainProbability: number; // 0-100
}

// Per als leads/entries del calendari de temporada (#794). Versió simplificada
// amb tempMin/tempMax + `kind` mapejat al sistema visual del lab.
export type EventWeatherKind = 'sun' | 'partly' | 'cloud' | 'rain' | 'storm';

export interface EventWeather {
  kind: EventWeatherKind;
  tempMin: number;
  tempMax: number;
  description: string;
  rainProbability: number;
}

const OWM_KIND_MAP: Record<string, EventWeatherKind> = {
  Clear: 'sun',
  Clouds: 'cloud',
  Rain: 'rain',
  Drizzle: 'rain',
  Thunderstorm: 'storm',
  Snow: 'storm',
  Mist: 'cloud',
  Fog: 'cloud',
  Haze: 'cloud',
  Dust: 'cloud',
  Smoke: 'cloud',
};

export function owmMainToKind(main: string | undefined | null): EventWeatherKind {
  if (!main) return 'partly';
  return OWM_KIND_MAP[main] ?? 'partly';
}

// ─── Cache en memòria (1 hora) ──────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

let cachedForecasts: WeatherForecast[] | null = null;
let cachedAt = 0;

function shouldSkipExternalWeather(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ADMIN_DEV_EXTERNAL_WEATHER !== '1';
}

function isCacheValid(): boolean {
  return cachedForecasts !== null && Date.now() - cachedAt < CACHE_TTL_MS;
}

// ─── Mapping de condicions a descripció catalana ────────────────────

// ─── OpenWeatherMap API ─────────────────────────────────────────────

interface OWMForecastItem {
  dt: number;
  main: { temp: number };
  weather: Array<{ main: string; description: string; icon: string }>;
  pop: number; // probability of precipitation (0-1)
}

interface OWMResponse {
  list: OWMForecastItem[];
  city?: { name: string };
}

async function fetchWeatherForLocation(
  location: string,
  apiKey: string,
  eventDate: Date
): Promise<{ temp: number; icon: string; description: string; rainProbability: number } | null> {
  try {
    const geo = await geocodeWithNominatim(location);
    const owmBase = 'https://api.openweathermap.org/data/2.5/forecast';
    const owmSuffix = `&appid=${apiKey}&units=metric&lang=ca`;
    const url = geo
      ? `${owmBase}?lat=${geo.lat}&lon=${geo.lon}${owmSuffix}`
      : `${owmBase}?q=${encodeURIComponent(extractOWMCity(location))}${owmSuffix}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) {
      log.warn(`Resposta no vàlida d'OpenWeatherMap per "${location}": ${response.status}`);
      return null;
    }

    const data: OWMResponse = await response.json();

    if (!data.list || data.list.length === 0) {
      log.warn(`Sense dades de previsió per "${location}"`);
      return null;
    }

    // Trobar la previsió més propera a la data de l'event
    const eventTimestamp = eventDate.getTime() / 1000;
    let closest = data.list[0];
    let minDiff = Math.abs(closest.dt - eventTimestamp);

    for (const item of data.list) {
      const diff = Math.abs(item.dt - eventTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }

    const weatherMain = closest.weather[0]?.main || 'Clear';
    const descriptionCa = WEATHER_DESCRIPTIONS_CA[weatherMain] || weatherMain;

    return {
      temp: Math.round(closest.main.temp),
      icon: closest.weather[0]?.icon || '01d',
      description: descriptionCa,
      rainProbability: Math.round((closest.pop || 0) * 100),
    };
  } catch (error) {
    log.error(`Error obtenint previsió per "${location}"`, error);
    return null;
  }
}

// ─── Extreu nom de ciutat per al paràmetre ?q= d'OWM ───────────────────
// OWM no accepta adreces completes: "Kimera, Carrer X, 08850 Gavà" → "Gavà"
function extractOWMCity(location: string): string {
  // Codi postal espanyol (5 dígits) seguit del nom de municipi
  const postalMatch = location.match(/\b\d{5}\s+([^,]+)/);
  if (postalMatch) return postalMatch[1].trim();
  // Darrer segment de la llista de comes que no comenci per número
  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] && !/^\d/.test(parts[i]) && parts[i].length > 1) return parts[i];
  }
  return location;
}

// ─── Geocoding via Nominatim (OSM) ─────────────────────────────────────
// Gratuït, sense clau. Accepta noms de lloc, adreces i establiments.
// Condicions d'ús: 1 req/s màxim + User-Agent identificatiu.

const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h — ubicacions no canvien
const geoCache = new Map<string, { value: { lat: number; lon: number } | null; cachedAt: number }>();

async function geocodeWithNominatim(location: string): Promise<{ lat: number; lon: number } | null> {
  const key = location.toLowerCase().trim();
  const cached = geoCache.get(key);
  if (cached && Date.now() - cached.cachedAt < GEO_CACHE_TTL_MS) return cached.value;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=es`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OrbitaEvents/1.0 (admin@orbitaevents.com)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      geoCache.set(key, { value: null, cachedAt: Date.now() });
      return null;
    }
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) {
      geoCache.set(key, { value: null, cachedAt: Date.now() });
      return null;
    }
    const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    geoCache.set(key, { value: result, cachedAt: Date.now() });
    return result;
  } catch (err) {
    log.warn(`geocodeWithNominatim: error per "${location}"`, { error: String(err) });
    geoCache.set(key, { value: null, cachedAt: Date.now() });
    return null;
  }
}

// ─── Cache per location+data (per al calendari de temporada, #794) ─────

const eventWeatherCache = new Map<string, { value: EventWeather | null; cachedAt: number }>();

function eventCacheKey(location: string, eventDate: Date): string {
  const y = eventDate.getUTCFullYear();
  const m = String(eventDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(eventDate.getUTCDate()).padStart(2, '0');
  return `${location.toLowerCase()}|${y}-${m}-${d}`;
}

export async function getWeatherForEvent(
  location: string,
  eventDate: Date,
): Promise<EventWeather | null> {
  if (shouldSkipExternalWeather()) return null;

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  // L'API gratuïta d'OWM només dona forecast a 5 dies vista.
  const now = Date.now();
  const horizonMs = 5 * 86400000;
  if (eventDate.getTime() - now > horizonMs) return null;
  if (eventDate.getTime() < now - 86400000) return null; // events passats: irrellevant

  const key = eventCacheKey(location, eventDate);
  const cached = eventWeatherCache.get(key);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    // 1r intent: geocoding precís via Nominatim → lat/lon
    const geo = await geocodeWithNominatim(location);
    const owmBase = 'https://api.openweathermap.org/data/2.5/forecast';
    const owmSuffix = `&appid=${apiKey}&units=metric&lang=ca`;
    const owmUrl = geo
      ? `${owmBase}?lat=${geo.lat}&lon=${geo.lon}${owmSuffix}`
      : `${owmBase}?q=${encodeURIComponent(extractOWMCity(location))}${owmSuffix}`;

    const response = await fetch(owmUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      log.warn(`getWeatherForEvent: sense previsió per "${location}": ${response.status}`);
      eventWeatherCache.set(key, { value: null, cachedAt: now });
      return null;
    }
    const data: OWMResponse = await response.json();
    if (!data.list || data.list.length === 0) {
      eventWeatherCache.set(key, { value: null, cachedAt: now });
      return null;
    }

    // Filtrar tots els data points del dia de l'event (UTC).
    const eventY = eventDate.getUTCFullYear();
    const eventM = eventDate.getUTCMonth();
    const eventD = eventDate.getUTCDate();
    const sameDayPoints = data.list.filter((p) => {
      const ts = new Date(p.dt * 1000);
      return ts.getUTCFullYear() === eventY && ts.getUTCMonth() === eventM && ts.getUTCDate() === eventD;
    });

    // Si no hi ha punts del dia exacte, fallback al més proper.
    const points = sameDayPoints.length > 0 ? sameDayPoints : [
      data.list.reduce((closest, p) => {
        const diff = Math.abs(p.dt * 1000 - eventDate.getTime());
        const closestDiff = Math.abs(closest.dt * 1000 - eventDate.getTime());
        return diff < closestDiff ? p : closest;
      }, data.list[0]),
    ];

    const temps = points.map((p) => p.main.temp);
    const tempMin = Math.round(Math.min(...temps));
    const tempMax = Math.round(Math.max(...temps));
    const maxRain = points.reduce((m, p) => Math.max(m, p.pop ?? 0), 0);

    // Kind dominant: el que apareix més vegades; si rain/storm hi és, prevalen.
    const kindCounts = new Map<EventWeatherKind, number>();
    for (const p of points) {
      const kind = owmMainToKind(p.weather[0]?.main);
      kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1);
    }
    let dominant: EventWeatherKind = 'partly';
    if (kindCounts.has('storm')) dominant = 'storm';
    else if (kindCounts.has('rain')) dominant = 'rain';
    else {
      let best = 0;
      for (const [k, c] of kindCounts.entries()) {
        if (c > best) { best = c; dominant = k; }
      }
    }

    const description = WEATHER_DESCRIPTIONS_CA[points[0].weather[0]?.main || 'Clear']
      || points[0].weather[0]?.description
      || 'Sense dades';

    const result: EventWeather = {
      kind: dominant,
      tempMin,
      tempMax,
      description,
      rainProbability: Math.round(maxRain * 100),
    };
    eventWeatherCache.set(key, { value: result, cachedAt: now });
    return result;
  } catch (error) {
    log.error(`getWeatherForEvent: error per a "${location}"`, error);
    eventWeatherCache.set(key, { value: null, cachedAt: now });
    return null;
  }
}

// ─── Funció principal ───────────────────────────────────────────────

export async function getEventWeatherForecast(): Promise<WeatherForecast[]> {
  if (shouldSkipExternalWeather()) {
    return [];
  }

  // Retornar buit si no hi ha API key
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return [];
  }

  // Retornar cache si és vàlida
  if (isCacheValid()) {
    return cachedForecasts!;
  }

  try {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    threeDaysLater.setHours(23, 59, 59, 999);

    // Buscar reserves dels pròxims 3 dies amb estat CONFIRMED o PREPARING
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING'] },
        eventDate: {
          gte: now,
          lte: threeDaysLater,
        },
        eventLocation: { not: '' },
      },
      select: {
        id: true,
        clientName: true,
        eventDate: true,
        eventLocation: true,
      },
      orderBy: { eventDate: 'asc' },
    });

    if (bookings.length === 0) {
      cachedForecasts = [];
      cachedAt = Date.now();
      return [];
    }

    // Consultar el temps per a cada reserva (en paral·lel)
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const weather = await fetchWeatherForLocation(
          booking.eventLocation,
          apiKey,
          booking.eventDate
        );

        if (!weather) return null;

        return {
          bookingId: booking.id,
          clientName: booking.clientName,
          eventDate: booking.eventDate.toISOString(),
          location: booking.eventLocation,
          temp: weather.temp,
          icon: weather.icon,
          description: weather.description,
          rainProbability: weather.rainProbability,
        } satisfies WeatherForecast;
      })
    );

    const forecasts = results
      .filter((r): r is PromiseFulfilledResult<WeatherForecast | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((f): f is WeatherForecast => f !== null);

    // Guardar a cache
    cachedForecasts = forecasts;
    cachedAt = Date.now();

    return forecasts;
  } catch (error) {
    log.error('Error obtenint previsions meteorològiques per als events', error);
    return [];
  }
}

/**
 * weatherService.ts — Previsió meteorològica per a pròxims events
 *
 * Consulta OpenWeatherMap (free tier, 5-day forecast) per a reserves
 * amb status CONFIRMED o PREPARING en els pròxims 3 dies.
 * Si no hi ha API key configurada, retorna array buit (graceful fallback).
 * Cache en memòria d'1 hora per evitar crides excessives.
 */

import { prisma } from '@/lib/prisma';
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

// ─── Cache en memòria (1 hora) ──────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

let cachedForecasts: WeatherForecast[] | null = null;
let cachedAt = 0;

function isCacheValid(): boolean {
  return cachedForecasts !== null && Date.now() - cachedAt < CACHE_TTL_MS;
}

// ─── Mapping de condicions a descripció catalana ────────────────────

const WEATHER_DESCRIPTIONS_CA: Record<string, string> = {
  Clear: 'Cel serè',
  Clouds: 'Ennuvolat',
  Rain: 'Pluja',
  Drizzle: 'Plugim',
  Thunderstorm: 'Tempesta',
  Snow: 'Neu',
  Mist: 'Boira lleugera',
  Fog: 'Boira',
  Haze: 'Calitja',
  Dust: 'Pols',
  Sand: 'Sorra',
  Ash: 'Cendra volcànica',
  Squall: 'Ratxa de vent',
  Tornado: 'Tornado',
};

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
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=ca`;
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

// ─── Funció principal ───────────────────────────────────────────────

export async function getEventWeatherForecast(): Promise<WeatherForecast[]> {
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

'use client';

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS DE DATOS PÚBLICOS
// ═══════════════════════════════════════════════════════════════════════════
//
// Hooks para consumir las APIs públicas de disponibilidad y stats.
// Incluyen:
// - Cache local con SWR pattern
// - Loading states
// - Error handling
// - Datos por defecto mientras carga
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { log } from '@/lib/logger';
import { fetchPublicStats, type PublicStatsValues } from '@/lib/api/publicStatsClient';
import {
  fetchPublicAvailability,
  type AvailabilityValues,
  type AvailabilityMonth as CanonicalAvailabilityMonth,
} from '@/lib/api/publicAvailabilityClient';
import { fetchPublicPacks } from '@/lib/api/publicPacksClient';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

type MonthAvailability = CanonicalAvailabilityMonth;
type AvailabilityData = AvailabilityValues;

type StatsData = PublicStatsValues;

// ═══════════════════════════════════════════════════════════════════════════
// CACHE SIMPLE
// ═══════════════════════════════════════════════════════════════════════════

const cache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos - reduït per estalviar requests

function getCachedData<T>(key: string): T | null {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useAvailability
// ═══════════════════════════════════════════════════════════════════════════

interface UseAvailabilityReturn {
  data: AvailabilityData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;

  // Helpers
  nextSaturdayDate: Date | null;
  countdownTarget: Date | null;
  currentMonthAvailable: number;
}

// Helper per calcular el proper dissabte - NOMÉS cridar dins useEffect!
function getNextSaturday(): string {
  const now = new Date();
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  const nextSat = new Date(now);
  nextSat.setDate(now.getDate() + daysUntilSaturday);
  return nextSat.toISOString().slice(0, 10);
}

// DEFAULT SEGUR PER SSR - Sense dates calculades a nivell de mòdul!
const defaultAvailability: AvailabilityData = {
  nextAvailableDate: null, // Es calcula al client dins useEffect
  nextAvailableSaturday: null, // Es calcula al client dins useEffect
  monthlyAvailability: [],
  scarcityMessage: '',
  urgencyLevel: 'high',
};

export function useAvailability(): UseAvailabilityReturn {
  const locale = useLocale();
  const [data, setData] = useState<AvailabilityData>(defaultAvailability);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Inicialitzar dates només al CLIENT per evitar hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const nextSat = getNextSaturday();
    setData(prev => ({
      ...prev,
      nextAvailableDate: prev.nextAvailableDate || nextSat,
      nextAvailableSaturday: prev.nextAvailableSaturday || nextSat,
    }));
  }, []);

  const fetchData = useCallback(async () => {
    const cacheKey = `availability:${locale}`;
    // Check cache first
    const cached = getCachedData<AvailabilityData>(cacheKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchPublicAvailability(locale);

      if (response.ok) {
        setData(response.data);
        setCachedData(cacheKey, response.data);
        setError(null);
      } else {
        setError('Error desconocido');
      }
    } catch (err) {
      log.error('Error fetching availability', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helpers calculados
  const countdownTarget = useMemo(() => {
    if (data.nextAvailableSaturday) {
      return new Date(data.nextAvailableSaturday + 'T00:00:00');
    }
    if (data.nextAvailableDate) {
      return new Date(data.nextAvailableDate + 'T00:00:00');
    }
    return null;
  }, [data.nextAvailableSaturday, data.nextAvailableDate]);

  const nextSaturdayDate = countdownTarget;

  const currentMonthAvailable = data.monthlyAvailability[0]?.availableSaturdays || 0;

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    nextSaturdayDate,
    countdownTarget,
    currentMonthAvailable,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: usePublicStats
// ═══════════════════════════════════════════════════════════════════════════

interface UseStatsReturn {
  stats: StatsData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALORS MÍNIMS GARANTITS
// Aquests són els valors mínims que mostrarem. Si la BD té més, es mostrarà el real.
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_STATS_NUMBERS = {
  responseTime: '2h',
  yearStarted: 2023,
  peopleEntertained: 2000,
  technicalIncidents: 0,
  totalEvents: 50,
  totalWeddings: 15,
  totalCorporate: 10,
  totalParties: 20,
  averageRating: 5.0,
  googleRating: 5.0,
  googleReviewsCount: 1,
} as const;

export function usePublicStats(): UseStatsReturn {
  const locale = useLocale();
  const tStats = useTranslations('stats');
  const defaultStats = useMemo<StatsData>(() => ({
    yearsExperience: tStats('years.value'),
    coverage: tStats('coverage'),
    responseTime: DEFAULT_STATS_NUMBERS.responseTime,
    yearStarted: DEFAULT_STATS_NUMBERS.yearStarted,
    peopleEntertained: DEFAULT_STATS_NUMBERS.peopleEntertained,
    technicalIncidents: DEFAULT_STATS_NUMBERS.technicalIncidents,
    totalEvents: DEFAULT_STATS_NUMBERS.totalEvents,
    totalWeddings: DEFAULT_STATS_NUMBERS.totalWeddings,
    totalCorporate: DEFAULT_STATS_NUMBERS.totalCorporate,
    totalParties: DEFAULT_STATS_NUMBERS.totalParties,
    averageRating: DEFAULT_STATS_NUMBERS.averageRating,
    googleRating: DEFAULT_STATS_NUMBERS.googleRating,
    googleReviewsCount: DEFAULT_STATS_NUMBERS.googleReviewsCount,
  }), [tStats]);

  const [stats, setStats] = useState<StatsData>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cacheKey = `stats:${locale}`;
    const cached = getCachedData<StatsData>(cacheKey);
    if (cached) {
      setStats(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchPublicStats(locale);

      if (response.ok) {
        setStats(response.stats);
        setCachedData(cacheKey, response.stats);
        setError(null);
      } else {
        setError('Error desconocido');
      }
    } catch (err) {
      log.error('Error fetching stats', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setStats(defaultStats);
  }, [defaultStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useCountdown (mejorado con fecha real)
// ═══════════════════════════════════════════════════════════════════════════

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface UseCountdownReturn {
  timeLeft: TimeLeft;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(targetDate: Date | null): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatted = targetDate
    ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
    : '--';

  return {
    timeLeft,
    isExpired: timeLeft.total <= 0,
    formatted,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: usePrices (precios desde BBDD)
// ═══════════════════════════════════════════════════════════════════════════

interface PackPrice {
  slug: string;
  price: number;
  originalPrice: number | null;
  name: string;
}

interface UsePricesReturn {
  prices: Record<string, PackPrice>;
  isLoading: boolean;
  error: string | null;
  getPrice: (slug: string) => string;
}

export function usePrices(): UsePricesReturn {
  const [prices, setPrices] = useState<Record<string, PackPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = getCachedData<Record<string, PackPrice>>('prices');
    if (cached) {
      setPrices(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchPublicPacks();

      if (response.ok && Array.isArray(response.packs)) {
        const pricesMap: Record<string, PackPrice> = {};
        (response.packs as { slug: string; price: number; originalPrice?: number | null; name: string }[]).forEach((pack) => {
          pricesMap[pack.slug] = {
            slug: pack.slug,
            price: pack.price,
            originalPrice: pack.originalPrice || null,
            name: pack.name || pack.slug,
          };
        });
        setPrices(pricesMap);
        setCachedData('prices', pricesMap);
        setError(null);
      }
    } catch (err) {
      log.error('Error fetching prices', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPrice = useCallback((slug: string): string => {
    const pack = prices[slug];
    if (!pack) return '--€';
    return `${pack.price}€`;
  }, [prices]);

  return {
    prices,
    isLoading,
    error,
    getPrice,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type {
  AvailabilityData,
  MonthAvailability,
  StatsData,
  TimeLeft,
  UseAvailabilityReturn,
  UseStatsReturn,
  UseCountdownReturn,
  PackPrice,
  UsePricesReturn,
};

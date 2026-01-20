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
import { useLocale } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface MonthAvailability {
  month: string;
  monthName: string;
  year: number;
  totalSaturdays: number;
  availableSaturdays: number;
  bookedSaturdays: number;
  blockedSaturdays: number;
  saturdayDates: {
    date: string;
    status: 'available' | 'booked' | 'blocked';
  }[];
}

interface AvailabilityData {
  nextAvailableDate: string | null;
  nextAvailableSaturday: string | null;
  monthlyAvailability: MonthAvailability[];
  scarcityMessage: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface StatsData {
  yearsExperience: string;
  coverage: string;
  responseTime: string;
  yearStarted: number;
  peopleEntertained: number;
  technicalIncidents: number;
  totalEvents: number;
  totalWeddings: number;
  totalCorporate: number;
  totalParties: number;
  averageRating: number;
  googleRating: number | null;
  googleReviewsCount: number | null;
}

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
      const response = await fetch(`/api/public/availability?locale=${locale}`);
      const json = await response.json();

      if (json.ok) {
        const availabilityData = json.data as AvailabilityData;
        setData(availabilityData);
        setCachedData(cacheKey, availabilityData);
        setError(null);
      } else {
        setError(json.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
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
const defaultStats: StatsData = {
  yearsExperience: 'Des de 2023',     // Empresa fundada Agost 2023
  coverage: '2 Prov.',  // 2 províncies de cobertura
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
};

export function usePublicStats(): UseStatsReturn {
  const [stats, setStats] = useState<StatsData>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = getCachedData<StatsData>('stats');
    if (cached) {
      setStats(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/public/stats');
      const json = await response.json();

      if (json.ok) {
        const statsData = json.stats as StatsData;
        setStats(statsData);
        setCachedData('stats', statsData);
        setError(null);
      } else {
        setError(json.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
// HOOK: useOffer (para FlashOffer dinámico)
// ═══════════════════════════════════════════════════════════════════════════

interface OfferData {
  isActive: boolean;
  endDate: string | null;
  discount: number;
  ctaLink: string;
  title: string;
  description: string;
}

interface UseOfferReturn {
  offer: OfferData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultOffer: OfferData = {
  isActive: false,
  endDate: null,
  discount: 0,
  ctaLink: '/contacto',
  title: '',
  description: '',
};

export function useOffer(): UseOfferReturn {
  const [offer, setOffer] = useState<OfferData>(defaultOffer);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = getCachedData<OfferData>('offer');
    if (cached) {
      setOffer(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/public/offer');
      const json = await response.json();

      if (json.ok && json.offer) {
        const offerData: OfferData = {
          isActive: json.offer.isActive,
          endDate: json.offer.endDate || null,
          discount: json.offer.discount || 0,
          ctaLink: json.offer.ctaLink || '/contacto',
          title: json.offer.title || '',
          description: json.offer.description || '',
        };
        setOffer(offerData);
        setCachedData('offer', offerData);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching offer:', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    offer,
    isLoading,
    error,
    refetch: fetchData,
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
      const response = await fetch('/api/public/packs');
      const json = await response.json();

      if (json.ok && json.packs && Array.isArray(json.packs)) {
        const pricesMap: Record<string, PackPrice> = {};
        json.packs.forEach((pack: { slug: string; price: number; originalPrice?: number | null; name: string }) => {
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
      console.error('Error fetching prices:', err);
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
  OfferData,
  UseOfferReturn,
  PackPrice,
  UsePricesReturn,
};

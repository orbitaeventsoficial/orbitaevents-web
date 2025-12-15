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
  totalEvents: number;
  totalWeddings: number;
  totalCorporate: number;
  totalParties: number;
  totalTestimonials: number;
  averageRating: number;
  googleRating: number | null;
  googleReviewsCount: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHE SIMPLE
// ═══════════════════════════════════════════════════════════════════════════

const cache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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
  scarcityMessage: 'Només queden 2 dissabtes aquest mes',
  urgencyLevel: 'high',
};

export function useAvailability(): UseAvailabilityReturn {
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
    // Check cache first
    const cached = getCachedData<AvailabilityData>('availability');
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/public/availability');
      const json = await response.json();

      if (json.ok) {
        setData(json.data);
        setCachedData('availability', json.data);
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
  }, []);

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
const MINIMUM_STATS = {
  totalEvents: 48,      // Mínim 48 events
  totalWeddings: 15,    // Mínim 15 casaments
  totalCorporate: 10,   // Mínim 10 corporatius
  totalParties: 20,     // Mínim 20 festes
  averageRating: 4.9,   // Mínim 4.9 rating
  googleRating: 4.9,    // Mínim 4.9 Google
  googleReviewsCount: 20, // Mínim 20 reviews
};

const defaultStats: StatsData = {
  yearsExperience: 'Des de 2023',  // Empresa fundada Agost 2023
  coverage: 'Barcelona + Girona',  // 2 províncies de cobertura
  responseTime: '2h',
  totalEvents: MINIMUM_STATS.totalEvents,
  totalWeddings: MINIMUM_STATS.totalWeddings,
  totalCorporate: MINIMUM_STATS.totalCorporate,
  totalParties: MINIMUM_STATS.totalParties,
  totalTestimonials: 0,
  averageRating: MINIMUM_STATS.averageRating,
  googleRating: MINIMUM_STATS.googleRating,
  googleReviewsCount: MINIMUM_STATS.googleReviewsCount,
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
        // Aplicar mínims: mostrem el valor real si és major que el mínim
        const statsWithMinimums: StatsData = {
          ...json.stats,
          totalEvents: Math.max(json.stats.totalEvents || 0, MINIMUM_STATS.totalEvents),
          totalWeddings: Math.max(json.stats.totalWeddings || 0, MINIMUM_STATS.totalWeddings),
          totalCorporate: Math.max(json.stats.totalCorporate || 0, MINIMUM_STATS.totalCorporate),
          totalParties: Math.max(json.stats.totalParties || 0, MINIMUM_STATS.totalParties),
          averageRating: Math.max(json.stats.averageRating || 0, MINIMUM_STATS.averageRating),
          googleRating: json.stats.googleRating ? Math.max(json.stats.googleRating, MINIMUM_STATS.googleRating) : MINIMUM_STATS.googleRating,
          googleReviewsCount: json.stats.googleReviewsCount ? Math.max(json.stats.googleReviewsCount, MINIMUM_STATS.googleReviewsCount) : MINIMUM_STATS.googleReviewsCount,
        };
        setStats(statsWithMinimums);
        setCachedData('stats', statsWithMinimums);
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
// HOOK: useTestimonials
// ═══════════════════════════════════════════════════════════════════════════

interface TestimonialPublic {
  id: string;
  text: string;
  rating: number;
  eventType: string | null;
  eventDate: string | null;
  authorName: string;
  authorPhoto: string | null;
  showPhoto: boolean;
  createdAt: string;
}

interface TestimonialsData {
  testimonials: TestimonialPublic[];
  stats: {
    total: number;
    averageRating: number;
    fiveStarCount: number;
  };
}

interface UseTestimonialsReturn {
  data: TestimonialsData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultTestimonials: TestimonialsData = {
  testimonials: [],
  stats: {
    total: 0,
    averageRating: 5,
    fiveStarCount: 0,
  },
};

export function useTestimonials(limit: number = 10, eventType?: string): UseTestimonialsReturn {
  const [data, setData] = useState<TestimonialsData>(defaultTestimonials);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = `testimonials-${limit}-${eventType || 'all'}`;

    // Check cache first
    const cached = getCachedData<TestimonialsData>(cacheKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams({ limit: String(limit) });
      if (eventType) params.set('eventType', eventType);

      const response = await fetch(`/api/public/testimonials?${params}`);
      const json = await response.json();

      if (json.ok) {
        const testimonialsData = {
          testimonials: json.testimonials,
          stats: json.stats,
        };
        setData(testimonialsData);
        setCachedData(cacheKey, testimonialsData);
        setError(null);
      } else {
        setError(json.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [limit, eventType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
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
      const response = await fetch('/api/admin/settings?category=offer');
      const json = await response.json();

      if (json.ok && json.settings) {
        const s = json.settings;
        const offerData: OfferData = {
          isActive: s.offer_active === 'true' || s.offer_active === true,
          endDate: s.offer_end_date || null,
          discount: parseInt(s.offer_discount) || 0,
          ctaLink: s.offer_cta_link || '/contacto',
          title: s.offer_title || '',
          description: s.offer_description || '',
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
      const response = await fetch('/api/admin/packs');
      const json = await response.json();

      if (json.packs && Array.isArray(json.packs)) {
        const pricesMap: Record<string, PackPrice> = {};
        json.packs.forEach((pack: { slug: string; price: number; originalPrice?: number; translations?: Array<{ locale: string; name: string }> }) => {
          pricesMap[pack.slug] = {
            slug: pack.slug,
            price: pack.price,
            originalPrice: pack.originalPrice || null,
            name: pack.translations?.find((t: { locale: string }) => t.locale === 'es')?.name || pack.slug,
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
  TestimonialPublic,
  TestimonialsData,
  UseTestimonialsReturn,
  OfferData,
  UseOfferReturn,
  PackPrice,
  UsePricesReturn,
};

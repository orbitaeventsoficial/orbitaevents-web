import { NextResponse, type NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { buildPublicAvailability, generateFallbackPublicAvailability, type AvailabilityLocale } from '@/lib/services/publicAvailabilityService';

export const revalidate = 3600;

type AvailabilityResponse = {
  ok: boolean;
  data: {
    nextAvailableDate: string | null;
    nextAvailableSaturday: string | null;
    monthlyAvailability: {
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
    }[];
    scarcityMessage: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  generatedAt: string;
};

function getRequestLocale(req: NextRequest): AvailabilityLocale {
  const queryLocale = req.nextUrl.searchParams.get('locale');
  if (queryLocale === 'es' || queryLocale === 'ca' || queryLocale === 'en') {
    return queryLocale;
  }

  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale === 'es' || cookieLocale === 'ca' || cookieLocale === 'en') {
    return cookieLocale;
  }

  const acceptLanguage = req.headers.get('accept-language') || '';
  const languages = acceptLanguage.split(',').map((lang) => lang.trim().toLowerCase());
  for (const lang of languages) {
    if (lang.startsWith('ca')) return 'ca';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('es')) return 'es';
  }

  return 'es';
}

export async function GET(req: NextRequest) {
  const locale = getRequestLocale(req);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(generateFallbackPublicAvailability(locale), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  }

  try {
    const response: AvailabilityResponse = await buildPublicAvailability(locale);
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    log.error('Error obteniendo disponibilidad:', error);
    return NextResponse.json(generateFallbackPublicAvailability(locale), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  }
}

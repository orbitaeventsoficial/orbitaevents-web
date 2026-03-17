// app/api/recent-bookings/route.ts
// API per obtenir reserves recents per a les notificacions en viu

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { listRecentBookingsFeed } from '@/lib/services/recentBookingsService';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const result = await listRecentBookingsFeed();
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error fetching recent bookings:', error);
    return NextResponse.json({ bookings: [] });
  }
}

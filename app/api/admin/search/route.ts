// app/api/admin/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const MAX_RESULTS = 5;

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (query.length < 2) {
      return NextResponse.json({
        ok: true,
        leads: [],
        bookings: [],
        customers: [],
      });
    }

    const [leads, bookings, customers] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_RESULTS,
      }),
      prisma.booking.findMany({
        where: {
          OR: [
            { reference: { contains: query, mode: 'insensitive' } },
            { clientName: { contains: query, mode: 'insensitive' } },
            { clientEmail: { contains: query, mode: 'insensitive' } },
            { clientPhone: { contains: query } },
          ],
        },
        select: {
          id: true,
          reference: true,
          clientName: true,
          clientEmail: true,
          status: true,
          eventDate: true,
        },
        orderBy: { eventDate: 'desc' },
        take: MAX_RESULTS,
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          totalEvents: true,
          lastEventDate: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: MAX_RESULTS,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      leads,
      bookings,
      customers,
    });
  } catch (error) {
    log.error('Error admin search', error);
    return NextResponse.json({ error: 'Error buscant' }, { status: 500 });
  }
}

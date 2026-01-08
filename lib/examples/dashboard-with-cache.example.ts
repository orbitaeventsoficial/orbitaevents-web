/**
 * EXAMPLE: Optimized Dashboard API with Query Caching
 *
 * This is an example showing how to optimize the dashboard API route
 * using the query cache system. This reduces database load significantly.
 *
 * BEFORE: 14 separate database queries, no caching
 * AFTER: Cached queries with automatic invalidation
 *
 * To use: Replace the code in app/api/admin/dashboard/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cachedQuery, CacheKeys, CacheTTL, invalidateCachePattern } from '@/lib/query-cache';
import { handleApiError } from '@/lib/api-error-handler';
import { logInfo } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    // Use cachedQuery to reduce database load
    // Each query is cached for 1 minute (configurable)

    const [
      totalLeads,
      newLeadsThisMonth,
      leadsThisYear,
      totalBookings,
      bookingsThisMonth,
      bookingsThisYear,
      confirmedBookings,
      pendingBookings,
      totalRevenue,
      revenueThisMonth,
      revenueThisYear,
      averageBookingValue,
      recentLeads,
      upcomingEvents,
    ] = await Promise.all([
      // Total leads - Cache for 1 minute
      cachedQuery(
        CacheKeys.leadsCount(),
        () => prisma.lead.count(),
        CacheTTL.SHORT
      ),

      // New leads this month - Cache for 30 seconds (more dynamic)
      cachedQuery(
        `leads:count:month:${startOfMonth.toISOString()}`,
        () =>
          prisma.lead.count({
            where: { createdAt: { gte: startOfMonth } },
          }),
        CacheTTL.VERY_SHORT
      ),

      // Leads this year - Cache for 5 minutes
      cachedQuery(
        `leads:count:year:${startOfYear.getFullYear()}`,
        () =>
          prisma.lead.count({
            where: { createdAt: { gte: startOfYear } },
          }),
        CacheTTL.MEDIUM
      ),

      // Total bookings - Cache for 1 minute
      cachedQuery(
        CacheKeys.bookingsCount(),
        () => prisma.booking.count(),
        CacheTTL.SHORT
      ),

      // Bookings this month
      cachedQuery(
        `bookings:count:month:${startOfMonth.toISOString()}`,
        () =>
          prisma.booking.count({
            where: { createdAt: { gte: startOfMonth } },
          }),
        CacheTTL.VERY_SHORT
      ),

      // Bookings this year
      cachedQuery(
        `bookings:count:year:${startOfYear.getFullYear()}`,
        () =>
          prisma.booking.count({
            where: { createdAt: { gte: startOfYear } },
          }),
        CacheTTL.MEDIUM
      ),

      // Confirmed bookings - Cache for 30 seconds
      cachedQuery(
        'bookings:count:confirmed',
        () =>
          prisma.booking.count({
            where: { status: 'CONFIRMED' },
          }),
        CacheTTL.VERY_SHORT
      ),

      // Pending bookings - Cache for 30 seconds
      cachedQuery(
        'bookings:count:pending',
        () =>
          prisma.booking.count({
            where: { status: 'PENDING' },
          }),
        CacheTTL.VERY_SHORT
      ),

      // Revenue calculations - Cache for 5 minutes
      cachedQuery(
        'revenue:total',
        async () => {
          const result = await prisma.booking.aggregate({
            where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            _sum: { finalPrice: true },
          });
          return result._sum.finalPrice || 0;
        },
        CacheTTL.MEDIUM
      ),

      cachedQuery(
        `revenue:month:${startOfMonth.toISOString()}`,
        async () => {
          const result = await prisma.booking.aggregate({
            where: {
              status: { in: ['CONFIRMED', 'COMPLETED'] },
              createdAt: { gte: startOfMonth },
            },
            _sum: { finalPrice: true },
          });
          return result._sum.finalPrice || 0;
        },
        CacheTTL.SHORT
      ),

      cachedQuery(
        `revenue:year:${startOfYear.getFullYear()}`,
        async () => {
          const result = await prisma.booking.aggregate({
            where: {
              status: { in: ['CONFIRMED', 'COMPLETED'] },
              createdAt: { gte: startOfYear },
            },
            _sum: { finalPrice: true },
          });
          return result._sum.finalPrice || 0;
        },
        CacheTTL.MEDIUM
      ),

      cachedQuery(
        'revenue:average',
        async () => {
          const result = await prisma.booking.aggregate({
            where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            _avg: { finalPrice: true },
          });
          return result._avg.finalPrice || 0;
        },
        CacheTTL.MEDIUM
      ),

      // Recent leads - Cache for 30 seconds
      cachedQuery(
        'leads:recent:5',
        () =>
          prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              name: true,
              contact: true,
              eventType: true,
              eventDate: true,
              createdAt: true,
              status: true,
            },
          }),
        CacheTTL.VERY_SHORT
      ),

      // Upcoming events - Cache for 1 minute
      cachedQuery(
        'bookings:upcoming:10',
        () =>
          prisma.booking.findMany({
            where: {
              eventDate: { gte: new Date() },
              status: { in: ['CONFIRMED', 'PENDING'] },
            },
            orderBy: { eventDate: 'asc' },
            take: 10,
            select: {
              id: true,
              eventDate: true,
              eventType: true,
              eventLocation: true,
              finalPrice: true,
              status: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          }),
        CacheTTL.SHORT
      ),
    ]);

    logInfo('Dashboard stats fetched (with caching)', {
      totalLeads,
      totalBookings,
      totalRevenue,
    });

    return NextResponse.json({
      leads: {
        total: totalLeads,
        thisMonth: newLeadsThisMonth,
        thisYear: leadsThisYear,
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        thisYear: bookingsThisYear,
        confirmed: confirmedBookings,
        pending: pendingBookings,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        thisYear: revenueThisYear,
        average: averageBookingValue,
      },
      recent: {
        leads: recentLeads,
        events: upcomingEvents,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      context: 'Fetching dashboard stats',
      userMessage: 'Error al cargar las estadísticas del panel',
    });
  }
}

/**
 * IMPORTANT: Cache Invalidation
 *
 * When you create/update/delete data, invalidate related caches:
 *
 * // In app/api/admin/leads/route.ts POST:
 * await prisma.lead.create({ ... });
 * invalidateCachePattern('leads:*');
 * invalidateCachePattern('dashboard:*');
 *
 * // In app/api/admin/bookings/route.ts POST:
 * await prisma.booking.create({ ... });
 * invalidateCachePattern('bookings:*');
 * invalidateCachePattern('revenue:*');
 * invalidateCachePattern('dashboard:*');
 */
